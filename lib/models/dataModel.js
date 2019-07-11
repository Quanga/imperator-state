/* eslint-disable no-unused-vars */
const DataMapper = require("../mappers/data_mapper");
const { ControlUnitModel } = require("../models/unitModels");
const clone = require("clone");

class DataModel {
	constructor(emitter) {
		this.controlUnit = null;
		this.units = {};

		//external tools
		this.mapper = new DataMapper();
		this.emitter = emitter || null;
	}

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

					if (!this.controlUnit) {
						this.controlUnit = new ControlUnitModel(null, null);
					}

					this.controlUnit.units.unitsCount++;
					await this.updateBoosterCounts({
						keySwitchStatus,
						communicationStatus
					});

					if (this.emitter) {
						this.emitter.emit("UNITCOUNT", {
							serial: unit.data.parentSerial,
							typeId: 0,
							counts: this.controlUnit.units
						});
					}
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

					if (this.emitter) {
						this.emitter.emit("UNITCOUNT", {
							serial: parentSerial,
							typeId: 3,
							counts: this.units[parentSerial].units
						});
					}
				}
				break;
			default:
				return false;
			}

			await unit.setPath();
			return true;
		} catch (err) {
			console.err("Error insering unit", err);
		}
	}

	async upsertUnit(nextState, force) {
		try {
			const { typeId, serial } = nextState.data;

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

			this.updateUnitState(nextState);

			switch (typeId) {
			case 0:
				{
					nextState.data = await this.applyUpdate(
						prevState.data,
						diffs,
						nextState.data.created
					);

					this.controlUnit.data = nextState.data;
				}
				break;

			case 3:
				{
					let countUpdate = await this.updateBoosterCounts(diffs);
					nextState.data = await this.applyUpdate(
						prevState.data,
						diffs,
						nextState.data.created
					);
					this.units[serial].data = nextState.data;

					if (this.emitter && countUpdate) {
						this.emitter.emit("UNITCOUNT", {
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
					nextState.data = await this.applyUpdate(
						prevState.data,
						diffs,
						nextState.data.created
					);
					this.units[parentSerial].children[windowId].data = nextState.data;

					if (this.emitter && countUpdate) {
						this.emitter.emit("UNITCOUNT", {
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

			return { action: "UPDATE", value: nextState, diff: diffs };
		} catch (err) {
			console.log(err);
		}
	}

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
			console.error("Error getting unit", err);
		}
	}

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
			console.log(err, state);
		}
	}

	updateUnitState(unit) {
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
			console.error("Error updating state");
		}
	}

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
					objKey++;
				} else {
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
	}

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

		if (this.emitter) {
			this.emitter.emit("UNITCOUNT", {
				serial,
				typeId: 3,
				counts: this.units[serial].units
			});
		}

		return [unit];
	}

	async snapShot() {
		let controlUnit = clone(this.controlUnit);
		let units = clone(this.units);

		return { controlUnit, units };
	}
}

module.exports = DataModel;
