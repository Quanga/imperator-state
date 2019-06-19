/* eslint-disable no-unused-vars */
const DataMapper = require("../mappers/data_mapper");
const { ControlUnitModel } = require("../models/unitModels");
const clone = require("clone");

class DataModel {
	constructor() {
		this.controlUnit = null;
		this.units = {};

		//external tools
		this.mapper = new DataMapper();
	}

	insertUnit(unit) {
		const { typeId, serial, parentSerial } = unit.data;
		unit.data.created = unit.meta.storedPacketDate;

		const insertUnitAsync = async () => {
			switch (typeId) {
			case 0:
				this.controlUnit = unit;
				break;
			case 3:
				{
					const { keySwitchStatus, communicationStatus } = unit.data;
					this.units[serial] = unit;
					unit.data.parentSerial = this.controlUnit.data.serial;
					this.controlUnit.units.unitsCount++;
					await this.updateBoosterCounts({
						keySwitchStatus,
						communicationStatus
					});
				}
				break;
			case 4:
				{
					const { tagged, logged, detonatorStatus, program } = unit.data;
					const { windowId } = unit.data;
					//must do check to see if the parent does exists here or put into holding till parent is available
					this.units[parentSerial].children[windowId] = unit;
					this.units[parentSerial].units.unitsCount++;

					await this.updateEddCounts(unit, {
						tagged,
						logged,
						detonatorStatus,
						program
					});
				}
				break;
			default:
				return false;
			}

			await unit.setPath();
			return true;
		};
		return insertUnitAsync();
	}

	upsertUnit(nextState, force) {
		const updateUnitAsync = async () => {
			try {
				const { typeId, serial, parentSerial, windowId } = nextState.data;
				let diffs = null;

				let prevState = await this.getUnit(
					typeId,
					serial,
					parentSerial,
					windowId
				);

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
						nextState.data = await this.applyUpdate(prevState.data, diffs);
						this.controlUnit.data = nextState.data;

						if (diffs.length > 0 && diffs.hasOwnProperty("serial")) {
							let boosterKeys = Object.keys(this.units);

							for (let i = 0; i < boosterKeys.length; i++) {
								const unit = [boosterKeys[i]];
								unit.data.parentSerial = nextState.data.serial;
							}
						}
					}
					break;

				case 3:
					{
						await this.updateBoosterCounts(diffs);
						nextState.data = await this.applyUpdate(prevState.data, diffs);
						this.units[serial].data = nextState.data;
					}
					break;

				case 4:
					{
						const { windowId } = nextState.data;
						await this.updateEddCounts(nextState, diffs);
						nextState.data = await this.applyUpdate(prevState.data, diffs);
						this.units[parentSerial].children[windowId].data = nextState.data;
					}
					break;

				default:
					return;
				}

				nextState.data.modified = nextState.meta.storedPacketDate;
				return { action: "UPDATE", value: nextState, diff: diffs };
			} catch (err) {
				console.log(err);
			}
		};
		return updateUnitAsync();
	}

	getUnit(typeId, serial, parentSerial, windowId) {
		const getUnitAsync = async () => {
			switch (typeId) {
			case 0: {
				return this.controlUnit;
			}
			case 3: {
				return this.units[serial];
			}
			case 4: {
				return this.units[parentSerial].children[windowId];
			}
			default:
				return null;
			}
		};

		return getUnitAsync();
	}

	applyUpdate(nextState, diff) {
		if (!diff) return nextState;
		let applyUpdateAsync = async () => {
			for (const key in diff) {
				if (nextState.hasOwnProperty(key)) {
					if (diff[key] !== null) {
						nextState[key] = diff[key];
					}
				}
			}
			return nextState;
		};

		return applyUpdateAsync();
	}

	updateUnitState(unit) {
		const { typeId } = unit.data;

		switch (typeId) {
		case 0:
			{
				const { keySwitchStatus, fireButton } = unit.data;
				if (keySwitchStatus && fireButton) {
					unit.state = "FIRING";
				}
				if (!fireButton && keySwitchStatus) {
					unit.state = "ARMED";
				} else {
					unit.state = "DISARMED";
				}
			}
			break;
		default:
			return null;
		}
	}

	updateBoosterCounts(diffs) {
		const updateAsync = async () => {
			if (!diffs) return;
			//take the incoming state and check is you need to add or remove item in the count on the control unit
			const items = ["keySwitchStatus", "communicationStatus"];

			for (const item of items) {
				if (diffs.hasOwnProperty(item)) {
					let objKey = this.controlUnit.units[`${item}Count`];

					if (
						diffs[item] !== null &&
						diffs[item] !== 0 &&
						diffs[item] !== undefined
					) {
						objKey++;
					} else {
						if (objKey > 0) {
							if (diffs[item] !== null) {
								objKey--;
							}
						}
					}
					this.controlUnit.units[`${item}Count`] = objKey;
				}
			}
		};
		return updateAsync();
	}

	updateBoosterConnections(val, modified) {
		const updateAsync = async () => {
			let resultArr = [];

			const boosterKey = Object.keys(this.units);

			for (const unit of boosterKey) {
				const booster = clone(this.units[unit]);
				booster.data.communicationStatus = 0;
				booster.data.modified = modified;

				let updateRes = await this.upsertUnit(booster);
				resultArr.push(updateRes);
			}

			return resultArr;
		};

		return updateAsync();
	}

	updateEddCounts(nextState, diffs) {
		if (!diffs) return;

		const updateAsync = async () => {
			//take the incoming state and check is you need to add or remove item in the count on the control unit
			const { parentSerial } = nextState.data;
			const parent = this.units[parentSerial];

			const items = ["detonatorStatus", "logged", "tagged", "program"];

			for (const item of items) {
				if (diffs.hasOwnProperty(item)) {
					let objKey = parent.units[`${item}Count`];

					if (
						diffs[item] !== null &&
						diffs[item] !== 0 &&
						diffs[item] !== undefined
					) {
						objKey++;
					} else {
						if (objKey > 0) {
							if (diffs[item] !== null) {
								objKey--;
							}
						}
					}
					this.units[parentSerial].units[`${item}Count`] = objKey;
				}
			}
		};
		return updateAsync();
	}

	updateEDDConnections(serial, modified) {
		const updateAsync = async () => {
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
		};

		return updateAsync();
	}

	clearEdds(nextState) {
		const clearAsync = async () => {
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

			return [unit];
		};
		return clearAsync();
	}
}

module.exports = DataModel;
