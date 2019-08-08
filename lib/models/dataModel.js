/* eslint-disable no-unused-vars */

/**
 * @category Data Service
 * @module lib/models/dataModel
 */
const DataMapper = require("../mappers/data_mapper");
const { ControlUnitModel } = require("../models/unitModels");
const EventEmitter = require("events").EventEmitter;
const clone = require("clone");

/**
 * @category Data Service
 * @summary The DataModel which represents the state of the Data.
 * @extends EventEmitter
 */
class DataModel extends EventEmitter {
	constructor() {
		super();
		this.controlUnit = null;
		this.units = {};

		this.mapper = new DataMapper();
	}

	/**
	 * @summary Insert a unit into the model if it is not found
	 * @param {unitObj} unit
	 * @returns {Promise}
	 */
	async insertUnit(unit) {
		const { typeId, serial } = unit.data;

		try {
			switch (typeId) {
			case 0:
				this.controlUnit = unit;
				break;
			case 3:
				{
					const { keySwitchStatus, communicationStatus } = unit.data;
					this.units[serial] = unit;

					this.units[serial].event.on("COMMS_LOST", () => {
						let clonedUnit = clone(unit);
						clonedUnit.data.communicationStatus = 0;
						clonedUnit.data.modified = Date.now();
						this.emit("UNIT_COMMS_LOST", [clonedUnit]);
					});

					if (!this.controlUnit) {
						this.controlUnit = new ControlUnitModel(null, null);
					}

					this.controlUnit.units.unitsCount++;
					await this.updateBoosterCounts({
						keySwitchStatus,
						communicationStatus
					});

					unit.setLastCommunication(unit.data.created);

					this.emit("UNITCOUNT", {
						serial: unit.data.parentSerial,
						typeId: 0,
						counts: this.controlUnit.units
					});
				}
				break;
			case 4:
				{
					const { tagged, logged, detonatorStatus } = unit.data;
					const { program, parentSerial } = unit.data;

					const { windowId } = unit.data;
					this.units[parentSerial].children[windowId] = unit;
					this.units[parentSerial].units.unitsCount++;

					await this.updateEddCounts(unit, {
						tagged,
						logged,
						detonatorStatus,
						program
					});

					this.emit("UNITCOUNT", {
						serial: parentSerial,
						typeId: 3,
						counts: this.units[parentSerial].units
					});
				}
				break;
			default:
				return false;
			}

			await unit.setPath();
			return true;
		} catch (err) {
			this.emit("error", "Error insering unit", err);
		}
	}

	/**
	 * @summary Update a unit that is found
	 * @param {unitObj} prevState state found in the model
	 * @param {unitObj} nextState incoming state
	 * @param {diffObj} diffs found diffs
	 * @returns {Promise}
	 */
	async updateUnit(prevState, nextState, diffs) {
		const { typeId, serial, created } = nextState.data;

		await this.updateUnitState(nextState);

		switch (typeId) {
		case 0:
			{
				nextState.data = await this.applyUpdate(prevState.data, diffs, created);
				this.controlUnit.data = nextState.data;
			}
			break;

		case 3:
			{
				let countUpdate = await this.updateBoosterCounts(diffs);
				nextState.data = await this.applyUpdate(prevState.data, diffs, created);
				this.units[serial].data = nextState.data;

				if (nextState.data.communicationStatus) {
					this.units[serial].setLastCommunication(nextState.data.modified);
				}

				if (countUpdate) {
					this.emit("UNITCOUNT", {
						serial: this.controlUnit.data.serial,
						typeId: 0,
						counts: this.controlUnit.units
					});
				}
			}
			break;

		case 4:
			{
				const { windowId, parentSerial } = nextState.data;
				let countUpdate = await this.updateEddCounts(nextState, diffs);

				nextState.data = await this.applyUpdate(prevState.data, diffs, created);
				this.units[parentSerial].children[windowId].data = nextState.data;

				if (countUpdate) {
					this.emit("UNITCOUNT", {
						serial: parentSerial,
						typeId: 3,
						counts: this.units[parentSerial].units
					});
				}
			}
			break;

		default:
			return;
		}

		if (!nextState.data.path || nextState.data.path === "") {
			await nextState.setPath();
		}
		return true;
		//return { action: "UPDATE", value: nextState, diff: diffs };
	}

	/**
	 * @summary Upsert unit data
	 * @param {unitObj} nextState
	 * @param {boolean} force force an update even if there are no diffs
	 * @returns {Promise} void
	 * @mermaid graph LR
	 * 				subgraph incoming
						A[dataService]
					end
					subgraph upsertUnit
					A[dataService] -.->|nextState|getUnit
						getUnit -->|true|diff{diff}
					end
					subgraph external
						diff -->|false|insertUnit
						diff -->|true|updateUnit
					end

	 */
	async upsertUnit(nextState, force = false) {
		try {
			let diffs = null;

			let prevState = await this.getUnit(nextState);

			if (!prevState) {
				await this.insertUnit(nextState);
				return { action: "INSERT", value: nextState };
			}

			diffs = await this.mapper.getUpdates(nextState, prevState);
			if (!diffs && force !== true) {
				return { action: "NONE", value: nextState };
			}

			await this.updateUnit(prevState, nextState, diffs);
			return { action: "UPDATE", value: nextState, diff: diffs };
		} catch (err) {
			console.log(err);
			this.emit("error", "Error upserting unit", err);
		}
	}

	/**
	 * @summary getUnit using its state
	 * @param {unitObj} nextState
	 * @returns {Promise<unitObj>} return found unit or null
	 */
	async getUnit(nextState) {
		try {
			const { typeId, serial } = nextState.data;
			switch (typeId) {
			case 0: {
				return this.controlUnit;
			}
			case 3: {
				return this.units[serial];
			}
			case 4: {
				const { parentSerial, windowId } = nextState.data;
				return this.units[parentSerial].children[windowId];
			}
			default:
				return null;
			}
		} catch (err) {
			this.emit("error", "Error getting unit", err);
		}
	}

	/**
	 * @summary Applies the diffs to the State
	 * @param {unitObj} state
	 * @param {diffObj} diffs the diffs between the current state and previous state
	 * @param {number} modified timestamp on modified
	 * @returns {Promise<unitObj>} return found unit or null
	 */
	async applyUpdate(state, diff, modified) {
		try {
			if (!diff) return state;
			for (const key in diff) {
				if (state.hasOwnProperty(key)) {
					if (diff[key] !== null) {
						state[key] = diff[key];
					}
				}
			}
			state.modified = modified;

			return state;
		} catch (err) {
			this.emit("error", "Error applying state", err);
		}
	}

	/**
	 * @summary Applies the diffs to the State
	 * @param {unitObj} state
	 * @param {diffObj} diffs the diffs between the current state and previous state
	 * @param {number} modified timestamp on modified
	 * @returns {Promise<unitObj>} return found unit or null
	 */
	async updateUnitState(unit) {
		const { typeId } = unit.data;
		try {
			switch (typeId) {
			case 0:
				{
					const { keySwitchStatus, fireButton } = unit.data;
					if (keySwitchStatus === 1 && fireButton === 1) {
						unit.state = "FIRING";
					}
					if (fireButton === 0 && keySwitchStatus === 1) {
						unit.state = "ARMED";
					} else {
						unit.state = "DISARMED";
					}
				}
				break;

			default:
				return null;
			}
			return unit;
		} catch (err) {
			this.emit("error", "Error updating state", err);
		}
	}

	/**
	 * @summary Uppdate the booster counts on the control unit
	 * @param {diffObj} diffs the diffs between the current state and previous state
	 * @returns {Promise<unitObj>} return found unit or null
	 */
	async updateBoosterCounts(diffs) {
		if (!diffs) return false;
		//take the incoming state and check is you need to add or remove item in the count on the control unit
		const items = ["keySwitchStatus", "communicationStatus"];

		for (const item of items) {
			if (diffs.hasOwnProperty(item)) {
				let objKey = this.controlUnit.units[`${item}Count`];

				if (diffs[item] === 1) {
					objKey++;
				} else {
					if (objKey > 0) {
						if (diffs[item] == 0) {
							objKey--;
						}
					}
				}
				this.controlUnit.units[`${item}Count`] = objKey;
			}
		}
		return true;
	}

	/**
	 * @summary Update the booster connections
	 * @param {number} modified
	 * @returns {Promise<units>} return array of boosters
	 * @todo Check if this should be moved out of the model and into a service
	 */
	async updateBoosterConnections(modified) {
		let resultArr = [];

		const boosterKey = Object.keys(this.units);

		for (const unit of boosterKey) {
			const booster = clone(this.units[unit]);
			booster.data.communicationStatus = 0;
			booster.data.modified = modified;

			resultArr.push(booster);
		}

		return resultArr;
	}

	/**
	 * @summary Update the EDD counts
	 * @param {nextState} nextState object
	 * @param {diffObj} diffs
	 * @returns {Promise<units>} return array of boosters
	 * @todo Check if this should be moved out of the model and into a service
	 */
	async updateEddCounts(nextState, diffs) {
		if (!diffs) return false;

		//take the incoming state and check is you need to add or remove item in the count on the control unit
		const { parentSerial } = nextState.data;
		const parent = this.units[parentSerial];

		const items = ["detonatorStatus", "logged", "tagged", "program"];

		for (const item of items) {
			if (diffs.hasOwnProperty(item)) {
				let objKey = parent.units[`${item}Count`];

				if (diffs[item] === 1) {
					//console.log("adding to", item, objKey);
					objKey++;
				} else if (diffs[item] === 0) {
					if (objKey > 0) {
						if (diffs[item] === 0) {
							//console.log("diffs", diffs);
							//console.log("removing from", item, objKey);
							objKey--;
						}
					}
				}
				this.units[parentSerial].units[`${item}Count`] = objKey;
			}
		}
		return true;
	}

	/**
	 * @summary Update the EDD connections
	 * @param {string} serial object
	 * @param {number} modified
	 * @returns {Promise<units>} return array of boosters
	 * @todo Check if this should be moved out of the model and into a service
	 */
	async updateEDDConnections(serial, modified) {
		let resultArr = [];

		const eddKeys = Object.keys(this.units[serial].children);

		for (const unit of eddKeys) {
			const edd = clone(this.units[serial].children[unit]);
			edd.data.detonatorStatus = 0;
			edd.data.modified = modified;

			let updateRes = await this.upsertUnit(edd);
			resultArr.push(updateRes);
		}

		return resultArr;
	}

	/**
	 * @summary Reset the child counts to 0
	 * @param {object} nextState object
	 * @returns {Promise<units>} return array of boosters
	 * @todo Check if this should be moved out of the model and into a service
	 */
	async resetChildCount(nextState) {
		const { serial } = nextState.data;
		this.units[serial].children = {};
		this.units[serial].units = {
			unitsCount: 0,
			taggedCount: 0,
			loggedCount: 0,
			programCount: 0,
			detectedCount: 0,
			detonatorStatusCount: 0
		};

		const unit = await clone(this.units[serial]);
		unit.data.childCount = 0;

		this.emit("UNITCOUNT", {
			serial,
			typeId: 3,
			counts: this.units[serial].units
		});

		return [unit];
	}

	/**
	 * @summary Take a snapshot of the state
	 * @returns {Promise<object>} return array of boosters
	 * @todo Check if this should be moved out of the model and into a service
	 */
	async snapShot() {
		try {
			let controlUnit = clone(this.controlUnit);
			let units = clone(this.units);
			const unitsKeys = Object.keys(units);
			unitsKeys.forEach(u => {
				delete units[u].event;
				delete units[u].meta;
			});

			return { controlUnit, units };
		} catch (err) {
			console.log(err);
		}
	}
}

module.exports = DataModel;
