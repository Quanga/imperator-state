const EventEmitter = require("events");

class UnitModel extends EventEmitter {
	constructor(serial, parentSerial) {
		super();

		this.data = {
			serial: serial,
			parentSerial: parentSerial,
			typeId: null,
			parentType: null,
			created: null,
			modified: null,
			path: ""
		};

		this.meta = {
			storedPacketDate: null
		};
	}

	setPath() {
		return new Promise(resolve => {
			const { typeId, serial } = this.data;
			this.data.path = `${typeId}/${serial}`;
			resolve();
		});
	}
}

class ControlUnitModel extends UnitModel {
	constructor(serial, parentSerial) {
		super(serial, parentSerial);

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
	}
}

class SectionControlModel extends UnitModel {
	constructor(serial, parentSerial) {
		super(serial, parentSerial);

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
	constructor(serial, parentSerial) {
		super(serial, parentSerial);

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
		this.data.ledState = null;
		this.data.childCount = 0;
		this.data.loadCount = 0;

		this.meta._lastCommunication = new Date();
		this.childUnits = [];
	}

	set lastCommunication(value) {
		this.data.communicationStatus = 1;
		this.meta._lastCommunication = value;
		this.checkComs();
	}

	checkComs() {
		if (this.meta.communicationCountDown != undefined) {
			clearTimeout(this.meta.communicationCountDown);
		}
		this.meta.communicationCountDown = setTimeout(() => {
			this.data.communicationStatus = 0;
			delete this.meta.communicationCountDown;
		}, process.env.COMMUNICATION_CHECK_INTERVAL);
	}
}

class EDDModel extends UnitModel {
	constructor(serial, parentSerial) {
		super(serial, parentSerial);

		this.data.typeId = 4;
		this.data.parentType = 3;

		//status
		this.data.detonatorStatus = null;

		//bits
		this.data.bridgeWire = null;
		this.data.calibration = null;
		this.data.program = null;
		this.data.boosterFired = null;
		this.data.tagged = null;
		this.data.logged = null;
		this.data.delay = null;
		this.data.windowId = null;

		this.setPath = this.setPath.bind(this);
	}

	setPath() {
		return new Promise(resolve => {
			const { parentType, parentSerial, typeId, serial } = this.data;
			this.data.path = `${parentType}/${parentSerial}/${typeId}/${serial}`;
			resolve();
		});
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
