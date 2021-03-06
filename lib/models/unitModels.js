/**
 * @category Unit Models
 * @module lib/models/unitsModels
 */

const EventEmitter = require("events").EventEmitter;

/**
 * @category Unit Models
 * @summary Base Class Unit Models for the DataModel.
 * @param {string} serial - snapshot of the DataModel supplied by the Data Service
 * @memberof module:lib/models/unitsModels
 */
class UnitModel {
	constructor(serial) {
		this.data = {
			serial: serial,
			typeId: null,
			parentType: null,
			created: null,
			modified: null,
			path: ""
		};
	}

	async setPath() {
		const { typeId, serial } = this.data;
		this.data.path = `${typeId}/${serial}`;
	}
}

/**
 * @category Unit Models
 * @summary Control Unit for the DataModel.
 * @param {string} serial - snapshot of the DataModel supplied by the Data Service
 * @memberof module:lib/models/unitsModels
 */
class ControlUnitModel extends UnitModel {
	constructor(serial) {
		super(serial);

		this.data.typeId = 0;
		//status
		this.data.communicationStatus = 1;

		//bits
		this.data.keySwitchStatus = null;
		this.data.fireButton = null;
		this.data.cableFault = null;
		this.data.isolationRelay = null;
		this.data.earthLeakage = null;
		this.data.blastArmed = null;

		this.units = {
			unitsCount: 0,
			keySwitchStatusCount: 0,
			communicationStatusCount: 0
		};
	}
}

class SectionControlModel extends UnitModel {
	constructor(serial) {
		super(serial);

		this.data.typeId = 1;
		this.data.parentType = 0;

		//status
		this.data.communicationStatus = 1;

		//bits
		this.data.keySwitchStatus = null;
		this.data.cableFault = null;
		this.data.isolationRelay = null;
		this.data.earthLeakage = null;
		this.data.blastArmed = null;

		this.childUnits = [];
	}
}

class BoosterModel extends UnitModel {
	constructor(serial, parentSerial) {
		super(serial, parentSerial);
		this.data.typeId = 2;
		this.data.parentType = 1;

		//status
		this.data.communicationStatus = 1;

		//bits
		this.data.keySwitchStatus = null;
		this.data.detonatorStatus = null;

		this.data.boosterFired = null;
		this.data.partialBlast = null;
		this.data.missingPulseDetected = null;

		this.data.dcSupplyVoltage = null;
		this.data.mains = null;
	}
}

class CBoosterModel extends UnitModel {
	constructor(serial, ledState, childCount) {
		super(serial);

		this.data.typeId = 3;
		this.data.parentType = 0;

		//status
		this.data.communicationStatus = 1;

		//bits
		this.data.blastArmed = null;
		this.data.keySwitchStatus = null;
		this.data.isolationRelay = null;
		this.data.mains = null;
		this.data.lowBat = null;
		this.data.tooLowBat = null;
		this.data.dcSupplyVoltage = null;
		this.data.shaftFault = null;
		this.data.cableFault = null;
		this.data.earthLeakage = null;
		this.data.ledState = ledState || null;
		this.data.childCount = childCount !== undefined ? childCount : null;

		//counts
		this.units = {
			unitsCount: 0,
			taggedCount: 0,
			loggedCount: 0,
			programCount: 0,
			detectedCount: 0,
			detonatorStatusCount: 0
		};

		this.event = new EventEmitter();

		this.children = {};

		this.meta = { _lastCommunication: null };
	}

	async setLastCommunication(value) {
		this.data.communicationStatus = 1;
		this.meta._lastCommunication = value;

		this.checkComs();
	}

	async checkComs() {
		if (this.meta.communicationCountDown !== undefined) {
			clearTimeout(this.meta.communicationCountDown);
		}

		this.meta.communicationCountDown = setTimeout(
			() => this.emitTimeout(),
			parseInt(process.env.COMMUNICATION_CHECK_INTERVAL, 10)
		);
	}

	emitTimeout() {
		this.event.emit("COMMS_LOST", this);
		this.meta.communicationCountDown = undefined;
	}
}

class EDDModel extends UnitModel {
	constructor(serial, parentSerial, windowId, delay = null) {
		super(serial, parentSerial);
		this.data.parentSerial = parentSerial;
		this.data.typeId = 4;
		this.data.parentType = 3;

		//status
		this.data.detonatorStatus = 0;

		//bits
		this.data.bridgeWire = 0;
		this.data.calibration = 0;
		this.data.program = 0;
		this.data.boosterFired = 0;
		this.data.tagged = 0;
		this.data.logged = 0;
		this.data.delay = delay;
		this.data.windowId = windowId || null;

		this.setPath = this.setPath.bind(this);
	}

	async setPath() {
		const { parentType, parentSerial, typeId, windowId } = this.data;
		this.data.path = `${parentType}/${parentSerial}/${typeId}/${windowId}`;
	}
}

module.exports = {
	UnitModel,
	ControlUnitModel,
	SectionControlModel,
	BoosterModel,
	CBoosterModel,
	EDDModel
};
