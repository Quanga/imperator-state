/* eslint-disable max-len */
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
		this.auxUnits = {};

		this.mapper = new DataMapper();
	}

	/**
	 * @summary Upsert unit data
	 * @param {unitObj} nextState
	 * @param {boolean} forceFlag force an update even if there are no diffs
	 * @returns {Promise} void
	 * @todo Check that this is functioning correctly
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
	async upsertUnit(nextState, forceFlag) {
		try {
			const { serial, typeId } = nextState.data;
			let prevState = await this.getUnit(nextState);

			if (!prevState) {
				let inserted = await this.insertUnit(nextState);
				if (!inserted) throw new Error(inserted);
				return { action: "INSERT", value: { ...nextState } };
			}

			//check if the Control Unit matches.
			//TODO need to work out solution for no control unit when ccb is there
			if (
				prevState &&
				typeId === 0 &&
				serial !== prevState.data.serial &&
				prevState.data.serial !== null
			) {
				throw new Error(
					`Control Unit ${serial} does not match current serial ${prevState.data.serial}. Please re-initialise the system`
				);
			}

			let diffs = null;
			diffs = await this.mapper.getUpdates(nextState, prevState);
			// if (nextState.data.typeId === 3 && parseInt(nextState.data.serial, 10) === 77) {
			// 	console.log(`unit - ${nextState.data.serial} --- ${JSON.stringify(diffs)}`);
			// }

			if (!diffs && forceFlag !== true) {
				return { action: "NONE", value: { ...nextState } };
			}

			await this.updateUnit(prevState, nextState, diffs, forceFlag);

			return { action: "UPDATE", value: { ...nextState, diff: diffs } };
		} catch (error) {
			return { action: "ERROR", error };
		}
	}

	/**
	 * @summary Insert a unit into the model if it is not found
	 * @param {unitObj} unit
	 * @returns {Promise}
	 * @todo Need to work out solution for the main comms issue with the cbb with timeout.
	 */
	async insertUnit(unit) {
		const { typeId, serial, createdAt } = unit.data;

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
					clonedUnit.data.modifiedAt = Date.now();
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

				unit.setLastCommunication(unit.data.createdAt);

				this.emit("UNIT_COUNT", {
					serial: unit.data.parentSerial,
					typeId: 0,
					createdAt,
					counts: this.controlUnit.units
				});
			}
			break;
		case 4:
			{
				const { tagged, logged, detonatorStatus } = unit.data;
				const { program, parentSerial } = unit.data;

				const { windowId } = unit.data;
				if (windowId === null) throw new Error("Window ID cannot be null");
				if (windowId > 101) throw new Error("Window ID cannot be higher that 101");

				this.units[parentSerial].children[windowId] = unit;
				this.units[parentSerial].units.unitsCount++;

				await this.updateEddCounts(unit, {
					tagged,
					logged,
					detonatorStatus,
					program
				});

				this.emit("UNIT_COUNT", {
					serial: parentSerial,
					typeId: 3,
					createdAt,
					counts: this.units[parentSerial].units
				});
			}
			break;
		case 5:
			{
				this.auxUnits[serial] = unit;
			}
			break;
		default:
			return false;
		}

		await unit.setPath();
		return true;
	}

	/**
	 * @summary Update a unit that is found
	 * @param {unitObj} prevState state found in the model
	 * @param {unitObj} nextState incoming state
	 * @param {diffObj} diffs found diffs
	 * @returns {Promise}
	 */
	async updateUnit(prevState, nextState, diffs, forceFlag) {
		const { typeId, serial, createdAt } = nextState.data;

		await this.updateUnitState(nextState);

		switch (typeId) {
		case 0:
			nextState.data = await this.applyUpdate(prevState.data, diffs, createdAt, forceFlag);
			this.controlUnit.data = nextState.data;
			break;

		case 3:
			{
				let countUpdate = await this.updateBoosterCounts(diffs);
				nextState.data = await this.applyUpdate(prevState.data, diffs, createdAt, forceFlag);

				this.units[serial].data = nextState.data;

				if (nextState.data.communicationStatus) {
					this.units[serial].setLastCommunication(nextState.data.createdAt);
				}

				if (countUpdate) {
					this.emit("UNIT_COUNT", {
						serial: this.controlUnit.data.serial,
						createdAt,
						typeId: 0,
						counts: this.controlUnit.units
					});
				}
			}
			break;

		case 4:
			{
				const { windowId, parentSerial, delay } = nextState.data;
				if (delay > 15000) throw new Error("Invalid Delay Packet discarded");

				let countUpdate = await this.updateEddCounts(nextState, diffs);

				nextState.data = await this.applyUpdate(prevState.data, diffs, createdAt, forceFlag);
				this.units[parentSerial].children[windowId].data = nextState.data;

				if (countUpdate) {
					this.emit("UNIT_COUNT", {
						serial: parentSerial,
						typeId: 3,
						createdAt,
						counts: this.units[parentSerial].units
					});
				}
			}
			break;
		case 5:
			nextState.data = await this.applyUpdate(prevState.data, diffs, createdAt, forceFlag);
			this.auxUnits[serial].data = nextState.data;
			break;

		default:
			return;
		}

		if (!nextState.data.path || nextState.data.path === "") {
			await nextState.setPath();
		}
		return true;
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

				if (!this.units[parentSerial])
					throw new Error(`Unit ${parentSerial} does not exist. Cannot get information.`);

				return this.units[parentSerial].children[windowId];
			}
			case 5: {
				return this.auxUnits[serial];
			}
			default:
				return null;
			}
		} catch (err) {
			console.log(err);
			//this.emit("error", "Error getting unit", err);
		}
	}

	/**
	 * @summary Applies the diffs to the State
	 * @param {unitObj} state
	 * @param {diffObj} diffs the diffs between the current state and previous state
	 * @param {number} modifiedAt timestamp on modifiedAt
	 * @returns {Promise<unitObj>} return found unit or null
	 */
	async applyUpdate(state, diff, modifiedAt, forceFlag) {
		try {
			//console.log("DIFF>>>>>", diff);
			if (diff) {
				for (const key in diff) {
					if (state.hasOwnProperty(key)) {
						if (diff[key] !== null) {
							state[key] = diff[key];
						}
					}
				}
				state.modifiedAt = modifiedAt;
			}
			if (forceFlag === true) state.modifiedAt = modifiedAt;

			return state;
		} catch (err) {
			console.log(err);
			//this.emit("error", "Error applying state", err);
		}
	}

	/**
	 * @summary Applies the diffs to the State
	 * @param {unitObj} state
	 * @param {diffObj} diffs the diffs between the current state and previous state
	 * @param {number} modifiedAt timestamp on modifiedAt
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
				return unit;
			}
			return unit;
		} catch (err) {
			console.log(err);
			//this.emit("error", "Error updating state", err);
		}
	}

	/**
	 * @summary Uppdate the booster counts on the control unit
	 * @param {diffObj} diffs the diffs between the current state and previous state
	 * @returns {Promise<unitObj>} return found unit or null
	 */
	async updateBoosterCounts(diffs) {
		try {
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
		} catch (err) {
			console.log(err);
		}
	}

	/**
	 * @summary Update the booster connections
	 * @param {number} modifiedAt
	 * @returns {Promise<units>} return array of boosters
	 * @todo Check if this should be moved out of the model and into a service
	 */
	async updateBoosterConnections(modifiedAt) {
		try {
			let resultArr = [];

			const boosterKey = Object.keys(this.units);

			for (const unit of boosterKey) {
				const booster = clone(this.units[unit]);
				booster.data.communicationStatus = 0;
				booster.data.modifiedAt = modifiedAt;

				resultArr.push(booster);
			}

			return resultArr;
		} catch (err) {
			console.error(err);
		}
	}

	/**
	 * @summary Update the EDD counts
	 * @param {nextState} nextState object
	 * @param {diffObj} diffs
	 * @returns {Promise<units>} return array of boosters
	 * @todo Check if this should be moved out of the model and into a service
	 */
	async updateEddCounts(nextState, diffs) {
		try {
			if (!diffs) return false;

			//take the incoming state and check is you need to add or remove item in the count on the control unit
			const { parentSerial } = nextState.data;
			const parent = this.units[parentSerial];

			const items = ["detonatorStatus", "logged", "tagged", "program"];

			for (const item of items) {
				if (diffs.hasOwnProperty(item)) {
					let objKey = parent.units[`${item}Count`];

					if (diffs[item] === 1) {
						objKey++;
					} else if (diffs[item] === 0) {
						if (objKey > 0) {
							if (diffs[item] === 0) {
								objKey--;
							}
						}
					}
					this.units[parentSerial].units[`${item}Count`] = objKey;
				}
			}
			return true;
		} catch (err) {
			console.error(err);
		}
	}

	/**
	 * @summary Update the EDD connections
	 * @param {string} serial object
	 * @param {number} modifiedAt
	 * @returns {Promise<units>} return array of boosters
	 * @todo Check if this should be moved out of the model and into a service
	 */
	async updateEDDConnections(serial, modifiedAt) {
		try {
			let resultArr = [];

			const eddKeys = Object.keys(this.units[serial].children);

			for (const unit of eddKeys) {
				const edd = clone(this.units[serial].children[unit]);
				edd.data.detonatorStatus = 0;
				edd.data.modifiedAt = modifiedAt;

				let updateRes = await this.upsertUnit(edd);
				resultArr.push(updateRes.value);
			}

			return resultArr;
		} catch (err) {
			console.log(err);
		}
	}

	/**
	 * @summary Reset the child counts to 0
	 * @param {object} nextState object
	 * @returns {Promise<units>} return array of boosters
	 * @todo Check if this should be moved out of the model and into a service
	 */
	async resetChildCount(nextState) {
		try {
			const { serial, createdAt } = nextState.data;
			if (this.units[serial]) {
				this.units[serial].children = {};
				this.units[serial].units = {
					unitsCount: 0,
					taggedCount: 0,
					loggedCount: 0,
					programCount: 0,
					detectedCount: 0,
					detonatorStatusCount: 0
				};

				this.emit("UNIT_COUNT", {
					serial,
					typeId: 3,
					createdAt,
					counts: this.units[serial].units
				});
			}
		} catch (err) {
			console.log(err);
		}
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
			let auxUnits = clone(this.auxUnits);

			const unitsKeys = Object.keys(units);
			unitsKeys.forEach(u => {
				delete units[u].event;
				delete units[u].meta;
			});

			const auxUnitsKeys = Object.keys(auxUnits);
			auxUnitsKeys.forEach(u => {
				delete auxUnits[u].event;
				delete auxUnits[u].meta;
			});
			//console.log(JSON.stringify({ controlUnit, units, auxUnits }));

			return { controlUnit, units, auxUnits };
		} catch (err) {
			console.log(err);
		}
	}
}

module.exports = DataModel;
