/* eslint-disable require-atomic-updates */
/* eslint-disable no-prototype-builtins */
/* eslint-disable no-unused-vars */
/**
 * @category Data Service
 * @module lib/models/DataModel
 */
const EventEmitter = require("events").EventEmitter;
const fields = require("../configs/fields/fieldConstants");
const { createdAt, modifiedAt, windowId, typeId } = fields;
const { serial, parentSerial, counts, parentType } = fields;

const clone = require("clone");
const { diffIgnore } = require("../configs/utils/common");
const utils = require("../utils/common");
const UnitFSM = require("../models/units/unitFSM");
const unitFSMSchemas = require("../configs/units/fsm");
const unitSchemas = require("../configs/units/unitSchema");
const { PrimaryUnitModel, SecondaryUnitModel } = require("../models/units/unitModels");

/**
 * @class DataModel
 * @summary The DataModel which represents the currentState of the Data.
 * @extends EventEmitter
 */
class DataModel extends EventEmitter {
	constructor() {
		super();
		this.pseudoTime = null;

		this.units = {};
	}

	static create() {
		const dataModel = new DataModel();
		return dataModel;
	}

	withMode(mode) {
		if (!mode) throw new Error("Mode cannot be empty - check ENV");
		this.mode = mode;
		return this;
	}

	setPseudoTime(time) {
		this.pseudoTime = time;
		const allUnits = Object.keys(this.units);

		//allUnits.forEach(unit => this.units[3][unit].updatePseudoTime(time));
	}

	async stageUpsert(nextState, forceFlag) {
		const { data, meta, state } = nextState;

		try {
			this.setPseudoTime(meta[createdAt]);
			const prevState = this.getUnit(nextState);

			if (!prevState) {
				return {
					action: "INSERT",
					value: { nextState, diffs: { ...data, ...state } },
				};
			}

			//meta[modifiedAt] = meta[createdAt];

			const newState = {
				meta: { ...meta },
				data: { ...prevState.data, ...data },
				state: { ...state },
			};

			if (Object.prototype.hasOwnProperty.call(prevState.state, "machine")) {
				prevState.state.machine.setLastCommunication(meta[createdAt]);
			}

			const dataDiffs = await utils.getDiffAsync(prevState.data, newState.data, diffIgnore);
			const stateDiffs = await utils.getDiffAsync(prevState.state, newState.state, diffIgnore);
			const diffs = { ...stateDiffs, ...dataDiffs };

			if (!diffs && forceFlag !== true) {
				return { action: "NONE", value: { nextState: newState, prevState: newState } };
			}

			return { action: "UPDATE", value: { prevState, nextState: newState, diffs } };
		} catch (error) {
			this.emit("error", error);
			return { action: "ERROR", value: error };
		}
	}

	stageDeleteChildren(nextState, childTypeId = 4) {
		const prevState = this.getUnit(nextState);
		const { meta, data } = nextState;

		if (!prevState) {
			return { action: "ERROR", value: { message: "No parent unit found to delete" } };
		}

		if (!prevState.children || !prevState.children[childTypeId]) {
			return { action: "ERROR", value: { message: "No children have been loaded to remove" } };
		}
		const parent = prevState;
		const units = [...prevState.children[childTypeId]];

		return {
			action: "DELETE_CHILDREN",
			value: { parent, nextState: { meta: { ...meta }, data: { ...data } }, units },
		};
	}

	/**
	 * An object which supplies the commit action and supplies the next and previous states
	 * @typedef {Object} commitObj
	 * @property {Object} value
	 * @property {module:lib/models/UnitBaseModel~UnitBaseModel} value.prevState
	 * @property {UnitBaseModel} value.nextState
	 * @property {string} action
	 */

	/**
	 * Make a commit of a diff
	 * @param {commitObj} setObj
	 * @returns {promise<UnitModel>}
	 */
	commitUpsert(setObj) {
		try {
			const {
				value: { prevState, nextState, diffs },
				action,
			} = setObj;

			const { meta } = nextState;

			const index = Object.prototype.hasOwnProperty.call(meta, windowId) ? windowId : serial;
			const unitKey = meta[index];
			const parent = this.getParent(meta);

			switch (action) {
				case "INSERT":
					this.insertUnit(nextState, index, unitKey, parent);
					break;

				case "UPDATE":
					this.updateUnit(prevState, nextState, index, unitKey);
					break;

				case "DELETE":
					delete this.units[meta[typeId]][unitKey];
					break;
				case "DELETE_CHILDREN":
					{
						const { parent, units } = setObj.value;
						this.deleteChildren(parent, units);
					}
					break;
				case "NONE":
					break;
				default:
					throw new Error(`Operation not valid: ${action}`);
			}

			if (parent && action !== "NONE" && action !== "DELETE_CHILDREN") {
				this.updateAggregates(parent, prevState, nextState, diffs);
			}

			const metaReturn = prevState ? prevState.meta : nextState.meta;

			return { meta: { ...metaReturn }, data: { ...nextState.data }, state: { ...nextState.state } };
		} catch (error) {
			this.emit("error", error);
		}
	}

	/**
	 *@summary Commits and update to a DateModel Unit;
	 * @param {UnitModel} prevState DataModel UnitModel with state and FSM
	 * @param {UnitModel} nextState UnitModel without state
	 * @param {string} indexType The field used as index for this Model
	 * @param {string} unitKey
	 * @returns {promise} void
	 * @todo This needs to return rather than mutate and object;
	 */
	updateUnit(prevState, nextState, indexType, unitKey) {
		try {
			const { data: nextData, meta: nextMeta } = nextState;
			const { data: prevData, func } = prevState;
			const tId = nextMeta[typeId];
			const { units } = this;

			if (func.machine) {
				func.machine.toggleState(prevData, nextData);
			}

			switch (indexType) {
				case serial:
					units[tId][unitKey].setObj("data", { ...nextData }).setPath();
					break;

				case windowId:
					if (!units[tId][nextMeta[parentSerial]]) units[tId][nextMeta[parentSerial]] = {};
					units[tId][nextMeta[parentSerial]][unitKey].setObj("data", { ...nextData }).setPath();
					break;
			}

			//update the state if it is derived from a data value
			prevState.setState();
			prevState.meta[modifiedAt] = nextMeta[createdAt];

			return prevState;
		} catch (error) {
			this.emit("error", error);
		}
	}

	insertUnit(nextState, index, unitKey, parent) {
		try {
			const { meta } = nextState;
			const tId = meta[typeId];

			nextState.setPath();
			if (unitFSMSchemas()[tId]) {
				const thisUnitFSM = this.createUnitFSM(nextState);
				nextState.withFSM(thisUnitFSM);
			}

			let obj = utils.checkObjExists(this.units, tId);
			switch (index) {
				case serial:
					obj[tId][unitKey] = nextState;
					break;

				case windowId:
					utils.checkObjExists(obj[tId], meta[parentSerial]);
					obj[tId][meta[parentSerial]][unitKey] = nextState;
					break;
			}

			if (parent) {
				if (!parent.children[tId]) parent.children[tId] = [];
				parent.children[tId].push(unitKey);
			}
		} catch (error) {
			this.emit("error", error);
		}
	}

	/**
	 * Create the FSM to handle state for this unit
	 * @param {nextState} nextState
	 * @returns {UnitFSMModel} Unit FSM controller
	 */
	createUnitFSM(nextState) {
		const { meta, data } = nextState;
		try {
			return UnitFSM.create()
				.withTriggers(unitSchemas[meta[typeId]].fsm)
				.withFSM(unitFSMSchemas(nextState.meta, this)[meta[typeId]])
				.on("state", state => {
					this.emit("message", `getting state- typeId ${meta[typeId]} - ${meta[serial]} ---${state}`);
					nextState.state.communicationStatus = state !== "inactive" ? 1 : 0;
					nextState.state.currentState = state;

					if (state)
						this.emit("state", {
							[serial]: meta[serial],
							[typeId]: meta[typeId],
							[createdAt]: meta[modifiedAt] || meta[createdAt],
							state,
						});
				})
				.start()
				.withState({ ...data });
		} catch (error) {
			this.emit("error", error);
		}
	}

	async disarmBoosters() {
		try {
			const boosters = clone(this.units["3"]);

			const changedBoosters = Object.keys(boosters).map(boosterKey => {
				boosters[boosterKey].fsm.fsmService.send("COMM_LOST");
				return boosters[boosterKey];
			});

			const upserts = await Promise.all(
				changedBoosters.map(booster => this.stageUpsert(booster, true)),
			);

			const units = Object.keys(upserts).map(unit => this.commitUpsert({ ...upserts[unit] }));

			this.emit("persist", units);
		} catch (error) {
			console.log(error);
		}
	}

	async disconnectChildren(context) {
		try {
			const children = clone(this.units["4"][context.serial]);

			const offChild = Object.keys(children).map(childKey => {
				children[childKey].data.detonatorStatus = 0;
				children[childKey].state.communicationStatus = 0;
				return children[childKey];
			});

			const upserts = await Promise.all(offChild.map(unit => this.stageUpsert(unit)));

			const units = Object.keys(upserts).map(unit => this.commitUpsert({ ...upserts[unit] }));

			this.emit("persist", units);
		} catch (error) {
			console.log(error);
		}
	}

	deleteChildren(parent, indexs, childTypeId = 4) {
		try {
			const pSerial = parent.meta[serial];

			parent.children[childTypeId] = [];

			const result = Object.keys(indexs).map(unit => ({ ...this.units[childTypeId][pSerial][unit] }));
			delete this.units[childTypeId][pSerial];

			Object.keys(parent[counts]).forEach(k => (parent[counts][k] = 0));
			return result;
		} catch (error) {
			this.emit("error", error);
		}
	}

	/**
	 * @param {UnitModel} parent
	 * @param {UnitModel} prevState
	 * @param {UnitModel} nextState
	 * @param {Object} diffs
	 * @returns {promise<UnitModel>} parent
	 */
	updateAggregates(parent, prevState, nextState, diffs) {
		const { meta } = nextState;
		try {
			if (typeId === 0 || !diffs) return;

			if (parent) {
				if (parent[counts]) {
					const keysToAgg = Object.keys(parent[counts][meta[typeId]]);
					//need to get categories to aggregate
					keysToAgg.forEach(key => {
						const categoryKeys = Object.keys(parent[counts][meta[typeId]][key]);
						this.updateCounter(categoryKeys, key, diffs, parent, prevState, nextState);
					});
				}

				return parent;
			}
		} catch (error) {
			this.emit("error", error);
		}
	}

	updateCounter(keysToAgg, category, diffs, parent, prevState, nextState) {
		keysToAgg.forEach(agg => {
			const tId = nextState.meta[typeId];

			if (diffs.hasOwnProperty(agg)) {
				if (parent[counts][tId][category].hasOwnProperty(agg)) {
					if (diffs[agg] === 1) {
						parent[counts][tId][category][agg]++;
					} else if (diffs[agg] === 0) {
						if (parent[counts][tId][category][agg] > 0) {
							if (diffs[agg] === 0 && prevState && prevState[category][agg] !== null) {
								parent[counts][tId][category][agg]--;
							}
						}
					}
				}
			}
		});
	}

	/**
	 * @typedef meta
	 * @property  {string | number} serial
	 * @property  {number} typeId
	 * @property  {string | number} parentSerial
	 * @property  {number} patentType
	 */

	/**
	 * Get the parent using the meta object
	 * @param {meta} meta
	 * @returns {promise<UnitModel>} UnitModel
	 */
	getParent(meta) {
		try {
			if (meta[parentType] || meta[parentType] === 0) {
				const parObj = {
					meta: {
						[serial]: meta[parentSerial],
						[typeId]: meta[parentType],
					},
				};
				const parent = this.getUnit(parObj);
				return parent;
			}
		} catch (error) {
			this.emit("error", error);
		}
	}

	/**
	 * @summary getUnit using its nextState
	 * @param {unitObj} nextState
	 * @returns {Promise<unitObj>} return found unit or null
	 */
	getUnit(nextState) {
		const { meta } = nextState;

		try {
			utils.checkObjExists(this.units, meta[typeId]);

			const unitTypeId = meta[typeId];

			// if parentType = 0 then dont bother with serial as there can be only one
			// need to check which of these is the distinct item for the system.
			if (unitTypeId !== 0) {
				const collection = this.units[unitTypeId];
				const index = Object.prototype.hasOwnProperty.call(meta, windowId) ? windowId : serial;

				const unitKey = meta[index];
				switch (index) {
					case windowId:
						if (
							collection.hasOwnProperty(meta[parentSerial]) &&
							collection[meta[parentSerial]].hasOwnProperty(unitKey)
						) {
							return this.units[unitTypeId][meta[parentSerial]][unitKey];
						}
						break;
					case serial:
						if (collection.hasOwnProperty(unitKey)) return this.units[unitTypeId][unitKey];
						break;
				}
			} else {
				return this.getDistinct();
			}
		} catch (error) {
			this.emit("error", error);
		}
	}

	getDistinct() {
		const distinctUnit = Object.keys(this.units[0]);
		return distinctUnit.length > 0 ? this.units[0][distinctUnit[0]] : undefined;
	}

	snapShot() {
		try {
			const units = Object.keys(this.units).reduce((acc, cur) => {
				acc[cur] = Object.keys(this.units[cur]).reduce((uacc, ucur) => {
					if (
						this.units[cur][ucur] instanceof PrimaryUnitModel ||
						this.units[cur][ucur] instanceof SecondaryUnitModel
					) {
						uacc[ucur] = this.units[cur][ucur].unitData;
					} else {
						uacc[ucur] = Object.keys(this.units[cur][ucur]).reduce((dacc, dcur) => {
							dacc[dcur] = this.units[cur][ucur][dcur].unitData;
							return dacc;
						}, {});
					}
					return uacc;
				}, {});
				return acc;
			}, {});

			return units;
		} catch (error) {
			this.emit("error", error);
		}
	}

	updateUnitMeta(nextState) {
		const unit = this.getUnit(nextState);
		unit.meta = { ...unit.meta, ...nextState.meta };
		return clone(unit.unitData);
	}
}

module.exports = DataModel;
