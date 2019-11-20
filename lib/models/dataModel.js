/* eslint-disable require-atomic-updates */
/* eslint-disable max-len */
/* eslint-disable no-unused-vars */

const DataMapper = require("../mappers/data_mapper");
const { ControlUnitModel } = require("../models/unitModels");
const EventEmitter = require("events").EventEmitter;
const clone = require("clone");

const { dataModelEvents, unitModelEvents } = require("../constants/eventConstants");
const { unitTypes, systemModeTypes } = require("../constants/typeConstants");

/**
 * @category Models
 * @module models/DataModel
 */

/**
 * @class
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
		this.mode = null;
		this.pseudoTime = null;
	}

	setMode(mode) {
		if (!mode) throw new Error("Mode cannot be empty - check ENV");
		this.mode = mode;
	}

	setPseudoTime(time) {
		this.pseudoTime = time;
		const allUnits = Object.keys(this.units);
		allUnits.forEach(unit => this.units[unit].updatePseudoTime(time));
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
			const { serial, typeId, createdAt } = nextState.data;

			this.setPseudoTime(createdAt);
			let prevState = this.getUnit(nextState);

			if (!prevState && !serial && typeId === 4) {
				throw new Error("cannot add this detonator as it does not exist in the model");
			}

			if (!prevState) {
				let inserted = await this.insertUnit(nextState);
				if (!inserted) throw new Error(inserted);
				return { action: "INSERT", value: { ...nextState } };
			}

			//check if the Control Unit matches.
			//TODO need to work out solution for no control unit when ccb is there
			if (
				typeId === unitTypes.CONTROL_UNIT &&
				serial !== prevState.data.serial &&
				prevState.data.serial !== null
			) {
				throw new Error(
					`Control Unit ${serial} does not match current serial ${prevState.data.serial}. Please re-initialise the system`,
				);
			}

			if (typeId === unitTypes.BOOSTER_T2) {
				prevState.setLastCommunication();
			}

			let diffs = null;
			diffs = await this.mapper.getUpdates(nextState, prevState);

			if (!diffs && forceFlag !== true) {
				return { action: "NONE", value: { ...nextState } };
			}

			await this.updateUnit(prevState, nextState, diffs, forceFlag);

			return { action: "UPDATE", value: { ...nextState, diff: diffs } };
		} catch (error) {
			console.log(error);
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
		try {
			switch (typeId) {
				case unitTypes.CONTROL_UNIT:
					this.controlUnit = unit;
					break;

				case unitTypes.BOOSTER_T2:
					{
						const { keySwitchStatus, communicationStatus } = unit.data;
						this.units[serial] = unit;

						// set up event to send lost comms to dataservice
						this.units[serial].event.on(unitModelEvents.UNIT_COMM_LOST, (boosterUnit, createdAt) => {
							const { serial, typeId } = boosterUnit.data;
							this.emit(dataModelEvents.UNIT_COMMS_LOST, { serial, typeId, createdAt });
						});

						if (!this.controlUnit) {
							this.controlUnit = new ControlUnitModel(null, null);
							this.controlUnit.data.createdAt = createdAt;
						}

						this.controlUnit.units.unitsCount++;
						await this.updateBoosterCounts({
							keySwitchStatus,
							communicationStatus,
						});

						unit.setLastCommunication(unit.data.createdAt);

						this.emitUnitCountUpdate({
							serial: unit.data.parentSerial,
							typeId: unitTypes.CONTROL_UNIT,
							createdAt,
							counts: this.controlUnit.units,
						});
					}
					break;

				case unitTypes.EDD:
					{
						const { tagged, logged, detonatorStatus } = unit.data;
						const { program, parentSerial } = unit.data;

						const { windowId } = unit.data;
						if (windowId === null) throw new Error("Window ID cannot be null");

						switch (this.mode) {
							case systemModeTypes.AXXIS100 || systemModeTypes.AXXIS100_CFC:
								if (windowId > 101) throw new Error("Window ID cannot be higher that 101");
								break;

							case systemModeTypes.AXXIS500 ||
								systemModeTypes.AXXIS500_CFC ||
								systemModeTypes.AXXIS500_WIFI:
								if (windowId > 501) throw new Error("Window ID cannot be higher that 101");
								break;

							case systemModeTypes.HYDRA:
								if (windowId > 501) throw new Error("Window ID cannot be higher that 101");
								break;
						}

						this.units[parentSerial].children[windowId] = unit;
						this.units[parentSerial].units.unitsCount++;

						await this.updateEddCounts(null, unit, {
							tagged,
							logged,
							detonatorStatus,
							program,
						});

						this.emitUnitCountUpdate({
							serial: parentSerial,
							typeId: unitTypes.BOOSTER_T2,
							createdAt,
							counts: this.units[parentSerial].units,
						});
					}
					break;
				case unitTypes.CFC:
					{
						this.auxUnits[serial] = unit;
					}
					break;

				default:
					return false;
			}

			await unit.setPath();
			return true;
		} catch (error) {
			log.error(error);
			throw new Error(error);
		}
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

		this.updateUnitState(nextState);

		switch (typeId) {
			case unitTypes.CONTROL_UNIT:
				nextState.data = await this.applyUpdate(prevState.data, diffs, createdAt, forceFlag);
				this.controlUnit.data = nextState.data;
				break;

			case unitTypes.BOOSTER_T2:
				{
					let countUpdate = await this.updateBoosterCounts(diffs);
					nextState.data = await this.applyUpdate(prevState.data, diffs, createdAt, forceFlag);

					this.units[serial].data = nextState.data;

					if (countUpdate) {
						this.emitUnitCountUpdate({
							serial: this.controlUnit.data.serial,
							createdAt,
							typeId: unitTypes.CONTROL_UNIT,
							counts: this.controlUnit.units,
						});
					}
				}
				break;

			case unitTypes.EDD:
				{
					const { windowId, parentSerial, delay } = nextState.data;

					if (windowId === null) throw new Error("Window ID cannot be null");

					switch (this.mode) {
						case systemModeTypes.AXXIS100 || systemModeTypes.AXXIS100_CFC:
							if (windowId > 101) throw new Error("Window ID cannot be higher that 101");
							if (delay > 15000) throw new Error("Invalid Delay Packet discarded");
							break;

						case systemModeTypes.AXXIS500 ||
							systemModeTypes.AXXIS500_CFC ||
							systemModeTypes.AXXIS500_WIFI:
							if (windowId > 600) throw new Error("Window ID cannot be higher that 101");
							if (delay > 15000) throw new Error("Invalid Delay Packet discarded");
							break;

						case systemModeTypes.HYDRA:
							if (windowId > 600) throw new Error("Window ID cannot be higher that 101");
							if (delay > 40000) throw new Error(`Invalid Delay Packet discarded - ${delay}`);
							break;
					}

					let countUpdate = await this.updateEddCounts(prevState, nextState, diffs);

					nextState.data = await this.applyUpdate(prevState.data, diffs, createdAt, forceFlag);
					this.units[parentSerial].children[windowId].data = nextState.data;

					if (countUpdate) {
						this.emitUnitCountUpdate({
							serial: parentSerial,
							typeId: unitTypes.BOOSTER_T2,
							createdAt,
							counts: this.units[parentSerial].units,
						});
					}
				}
				break;

			case unitTypes.CFC:
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
	getUnit(nextState) {
		const { typeId, serial } = nextState.data;

		switch (typeId) {
			case unitTypes.CONTROL_UNIT: {
				return this.controlUnit;
			}

			case unitTypes.BOOSTER_T2: {
				return this.units[serial];
			}

			case unitTypes.EDD: {
				const { parentSerial, windowId } = nextState.data;

				if (!this.units[parentSerial])
					throw new Error(`Unit ${parentSerial} does not exist. Cannot get information.`);

				return this.units[parentSerial].children[windowId];
			}

			case unitTypes.CFC: {
				return this.auxUnits[serial];
			}

			default:
				return null;
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
		if (diff) {
			for (const key in diff) {
				if (Object.prototype.hasOwnProperty.call(state, key)) {
					if (diff[key] !== null) {
						state[key] = diff[key];
					}
				}
			}
			state.modifiedAt = modifiedAt;
		}

		if (forceFlag === true) state.modifiedAt = modifiedAt;

		return state;
	}

	/**
	 * @summary Applies the diffs to the State
	 * @param {unitObj} state
	 * @param {diffObj} diffs the diffs between the current state and previous state
	 * @param {number} modifiedAt timestamp on modifiedAt
	 * @returns {Promise<unitObj>} return found unit or null
	 */
	updateUnitState(unit) {
		const { typeId } = unit.data;
		try {
			switch (typeId) {
				case unitTypes.CONTROL_UNIT:
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
				if (Object.prototype.hasOwnProperty.call(diffs, item)) {
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
	async updateEddCounts(prevState, nextState, diffs) {
		try {
			if (!diffs) return false;

			//take the incoming state and check is you need to add or remove item in the count on the control unit
			const { parentSerial } = nextState.data;
			const parent = this.units[parentSerial];

			const items = ["detonatorStatus", "logged", "tagged", "program"];

			for (const item of items) {
				if (Object.prototype.hasOwnProperty.call(diffs, item)) {
					let objKey = parent.units[`${item}Count`];

					if (diffs[item] === 1) {
						objKey++;
					} else if (diffs[item] === 0) {
						if (objKey > 0) {
							if (diffs[item] === 0 && prevState && prevState.data[item] !== null) {
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
					detonatorStatusCount: 0,
				};

				this.emitUnitCountUpdate({
					serial,
					typeId: unitTypes.BOOSTER_T2,
					createdAt,
					counts: this.units[serial].units,
				});
			}
		} catch (err) {
			console.log(err);
		}
	}

	emitUnitCountUpdate(obj) {
		this.emit(dataModelEvents.UNIT_COUNT_UPDATED, obj);
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
				//delete units[u].meta;
			});

			const auxUnitsKeys = Object.keys(auxUnits);
			auxUnitsKeys.forEach(u => {
				delete auxUnits[u].event;
				//delete auxUnits[u].meta;
			});
			//console.log(JSON.stringify({ controlUnit, units, auxUnits }));

			return { controlUnit, units, auxUnits };
		} catch (err) {
			console.log(err);
		}
	}
}

module.exports = DataModel;
