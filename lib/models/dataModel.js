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
const { dataModelEvents } = require("../constants/eventConstants");
const { diffIgnore } = require("../configs/utils/common");
const utils = require("../utils/common");
const UnitFSM = require("../models/units/unitFSM");
const unitFSMSchemas = require("../configs/units/fsm");
const unitSchemas = require("../configs/units/unitSchema");

/**
 * @class DataModel
 * @summary The DataModel which represents the state of the Data.
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
			const prevState = await this.getUnit(nextState);

			if (!prevState) {
				return {
					action: "INSERT",
					value: { nextState, diffs: { ...data, ...state } },
				};
			}

			//meta[modifiedAt] = meta[createdAt];
			nextState.data = { ...prevState.data, ...data };

			if (Object.prototype.hasOwnProperty.call(prevState.state, "machine")) {
				prevState.state.machine.setLastCommunication(meta[createdAt]);
			}

			const dataDiffs = await utils.getDiffAsync(prevState.data, data, diffIgnore);
			const stateDiffs = await utils.getDiffAsync(prevState.state, state, diffIgnore);
			const diffs = { ...stateDiffs, ...dataDiffs };

			if (!diffs && forceFlag !== true) {
				return {
					action: "NONE",
					value: {
						nextState: nextState.pureData,
						prevState: nextState.pureData,
					},
				};
			}

			return {
				action: "UPDATE",
				value: {
					prevState,
					nextState: nextState.pureData,
					diffs,
				},
			};
		} catch (error) {
			this.emit("error", error);
			return { action: "ERROR", value: error };
		}
	}

	async stageDeleteChildren(nextState, childTypeId = 4) {
		const prevState = await this.getUnit(nextState);

		if (!prevState) {
			return {
				action: "ERROR",
				value: { message: "No parent unit found to delete" },
			};
		}

		if (!prevState.children || !prevState.children[childTypeId]) {
			return {
				action: "ERROR",
				value: { message: "No children have been loaded to remove" },
			};
		}
		const parent = prevState;
		const units = [...prevState.children[childTypeId]];
		return {
			action: "DELETE_CHILDREN",
			value: {
				parent,
				nextState: { meta: { ...nextState.meta }, data: { ...nextState.data } },
				units,
			},
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
	async commitUpsert(setObj) {
		try {
			const {
				value: { prevState, nextState, diffs },
				action,
			} = setObj;

			const { meta } = nextState;

			const index = Object.prototype.hasOwnProperty.call(meta, windowId) ? windowId : serial;
			const unitKey = meta[index];
			const parent = await this.getParent(meta);

			switch (action) {
				case "INSERT":
					await this.insertUnit(nextState, index, unitKey, parent);
					break;

				case "UPDATE":
					await this.updateUnit(prevState, nextState, index, unitKey);
					break;

				case "DELETE":
					delete this.units[meta[typeId]][unitKey];
					break;
				case "DELETE_CHILDREN":
					{
						const { parent, units } = setObj.value;
						await this.deleteChildren(parent, units);
					}
					break;
				case "NONE":
					break;
				default:
					throw new Error(`Operation not valid: ${action}`);
			}

			if (parent && action !== "NONE" && action !== "DELETE_CHILDREN") {
				await this.updateAggregates(parent, prevState, nextState, diffs);
			}

			const metaReturn = prevState ? prevState.meta : nextState.meta;

			return {
				meta: { ...metaReturn },
				data: { ...nextState.data },
				state: { ...nextState.state },
			};
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
	async updateUnit(prevState, nextState, indexType, unitKey) {
		try {
			const { data: nextData, meta: nextMeta } = nextState;
			const { data: prevData, meta: prevMeta, state: prevFSM } = prevState;
			const tId = nextMeta[typeId];
			const { units } = this;

			if (prevFSM.machine) {
				prevFSM.machine.toggleState(prevData, nextData);
			}

			switch (indexType) {
				case serial:
					await units[tId][unitKey].setObj("data", { ...nextData }).setPath();
					break;

				case windowId:
					if (!units[tId][parentSerial]) units[tId][parentSerial] = {};
					console.log(prevMeta);
					units[tId][nextMeta[parentSerial]][unitKey].setObj("data", { ...nextData }).setPath();
					break;
			}

			prevMeta[modifiedAt] = nextMeta[createdAt];
			return prevState;
		} catch (error) {
			this.emit("error", error);
		}
	}

	async insertUnit(nextState, index, unitKey, parent) {
		try {
			const { data, meta } = nextState;
			const tId = meta[typeId];

			nextState.setPath();

			if (unitFSMSchemas[tId]) {
				const thisUnitFSM = this.createUnitFSM(tId, meta, data, nextState);
				const unitWithFSM = nextState.withFSM(thisUnitFSM);
				nextState.currentState = unitWithFSM.func.machine.getState();
				this.enableTimeout(unitWithFSM, nextState);
			}

			let obj = await utils.checkObjExists(this.units, tId);
			switch (index) {
				case serial:
					obj[tId][unitKey] = nextState;
					break;

				case windowId:
					await utils.checkObjExists(obj[tId], meta[parentSerial]);
					obj[tId][meta[parentSerial]][unitKey] = nextState;
					break;
			}

			if (parent) {
				if (!parent.children[tId]) parent.children[tId] = [];
				parent.children[tId].push(unitKey);
			}
		} catch (error) {
			console.log(error);
			this.emit("error", error);
		}
	}

	enableTimeout(unitWithFSM, nextState) {
		if (
			Object.prototype.hasOwnProperty.call(unitWithFSM.state, "machine") &&
			Object.prototype.hasOwnProperty.call(nextState.func, "commTimeout")
		) {
			//unit.meta.commTimeout
			console.log("TIMER", nextState.func.commTimeout);
			unitWithFSM.state.machine.withTimeOut(nextState.func.commTimeout);
			//unitWithFSM.state.machine.setLastCommunication(data[createdAt]);
		}
	}

	createUnitFSM(tId, meta, data, nextState) {
		try {
			return UnitFSM.create()
				.withTriggers(unitSchemas[tId].fsm)
				.withFSM(unitFSMSchemas[tId])
				.withState({ ...data })
				.on("state", state => {
					nextState.state.currentState = { ...state };
					this.emit("state", {
						[serial]: meta[serial],
						[typeId]: meta[typeId],
						[createdAt]: meta[modifiedAt] || meta[createdAt],
						state,
					});
				});
		} catch (error) {
			this.emit("error", error);
		}
	}

	async deleteChildren(parent, indexs, childTypeId = 4) {
		try {
			const result = [];
			const pSerial = parent.meta[serial];
			const pCounts = parent[counts];

			parent.children[childTypeId] = [];

			for (const unit of indexs) {
				result.push({ ...this.units[childTypeId][pSerial][unit] });
				delete this.units[childTypeId][pSerial][unit];
			}

			Object.keys(pCounts).forEach(k => (pCounts[k] = 0));
			return { result };
		} catch (error) {
			this.emit("error", error);
		}
	}

	async updateAggregates(parent, prevState, nextState, diffs) {
		const { data, meta } = nextState;
		try {
			if (typeId === 0 || !diffs) return;

			if (parent) {
				if (Object.prototype.hasOwnProperty.call(parent, counts)) {
					const keysToAgg = Object.keys(parent[counts][meta[typeId]]);
					//need to get categories to aggregate
					keysToAgg.forEach(key => {
						const categoryKeys = Object.keys(parent[counts][meta[typeId]][key]);
						this.counter(categoryKeys, key, diffs, parent, prevState, nextState);
					});
				}
				return parent;
			}
		} catch (error) {
			this.emit("error", error);
		}
	}

	counter(keysToAgg, category, diffs, parent, prevState, nextState) {
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

	async getParent(meta) {
		try {
			if (meta[parentType] || meta[parentType] === 0) {
				const parObj = {
					meta: {
						[serial]: meta[parentSerial],
						[typeId]: meta[parentType],
					},
				};
				const parent = await this.getUnit(parObj);
				return parent;
			}
		} catch (error) {
			this.emit("error", error);
		}
	}

	/**
	 * @summary getUnit using its state
	 * @param {unitObj} nextState
	 * @returns {Promise<unitObj>} return found unit or null
	 */
	async getUnit(nextState) {
		const { meta } = nextState;

		try {
			await utils.checkObjExists(this.units, meta[typeId]);

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

	emitUnitCountUpdate(obj) {
		//this.emit(dataModelEvents.UNIT_COUNT_UPDATED, obj);
		this.emit(dataModelEvents.UNIT_COUNT_UPDATED, obj);
	}

	async snapShot() {
		try {
			const units = clone(this.units);

			const itemArr = ["domain", "_events", "_eventsCount", "_maxListeners", "machine"];
			this.removeProps(units, itemArr);

			return units;
		} catch (error) {
			this.emit("error", error);
		}
	}

	removeProps(obj, items) {
		// if (!obj) return;
		// Object.keys(obj).forEach(prop => {

		// });
		for (let prop in obj) {
			if (items.indexOf(prop) !== -1) {
				delete obj[prop];
			} else if (typeof obj[prop] === "object") this.removeProps(obj[prop], items);
		}
	}
}

module.exports = DataModel;
