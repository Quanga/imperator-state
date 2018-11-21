const EventEmitter = require("events");

class UnitModel extends EventEmitter {
	constructor(serial, parentSerial) {
		super();
		//Identifiers -- these are shared between all types
		this.data = {
			id: null,
			serial: serial,
			parent_serial: parentSerial,

			type_id: null,
			parent_type: null,

			parent_id: null,
			window_id: null,

			created: null,
			modified: null
		};

		this.meta = {
			storedPacketDate: null
		};
	}

	emitter() {
		console.log("calling emit");
		this.emit(
			"started",
			`emitting for ${this.data.serial} type - ${this.data.type_id}`
		);
	}
}

class ControlUnitModel extends UnitModel {
	constructor(serial, parentSerial) {
		super(serial, parentSerial);
		this.data.type_id = 0;

		//status
		this.data.communication_status = 1;

		//bits
		this.data.key_switch_status = null;
		this.data.fire_button = null;
		this.data.cable_fault = null;
		this.data.isolation_relay = null;
		this.data.earth_leakage = null;
		this.data.blast_armed = null;
	}
}

class SectionControlModel extends UnitModel {
	constructor(serial, parentSerial) {
		super(serial, parentSerial);

		this.data.type_id = 1;
		this.data.parent_type = 0;

		//status
		this.data.communication_status = 1;

		//bits
		this.data.key_switch_status = null;
		this.data.cable_fault = null;
		this.data.isolation_relay = null;
		this.data.earth_leakage = null;
		this.data.blast_armed = null;
		//EventEmitter.call(this.data);

		this.emitter();
	}
}

class BoosterModel extends UnitModel {
	constructor(serial, parentSerial) {
		super(serial, parentSerial);

		this.data.type_id = 2;
		this.data.parent_type = 1;

		//status
		this.data.communication_status = 1;

		//bits
		this.data.key_switch_status = null;
		this.data.detonator_status = null;

		this.data.booster_fired_lfs = null;
		this.data.partial_blast_lfs = null;
		this.data.missing_pulse_detected_lfs = null;

		this.data.DC_supply_voltage = null;
		this.data.mains = null;
		this.emitter();
	}
}

class CBoosterModel extends UnitModel {
	constructor(serial, parentSerial) {
		super(serial, parentSerial);

		this.data.type_id = 3;
		this.data.parent_type = 0;

		//status
		this.data.communication_status = 1;

		//bits
		this.data.blast_armed = null;

		this.data.key_switch_status = null;
		this.data.isolation_relay = null;

		this.data.mains = null;
		this.data.low_bat = null;
		this.data.too_low_bat = null;
		this.data.DC_supply_voltage_status = null;

		this.data.shaft_fault = null;
		this.data.cable_fault = null;
		this.data.earth_leakage = null;
		this.data.led_state = null;

		this.meta._lastCommunication = new Date();
	}

	set lastCommunication(value) {
		this.meta.communication_status = 1;
		this.meta._lastCommunication = value;
		this.meta.checkComs();
	}

	checkComs() {
		console.log(parseInt(process.env.COMMUNICATION_CHECK_INTERVAL));
		if (this.meta.communicationCountDown != undefined) {
			clearTimeout(this.meta.communicationCountDown);
			console.log("CLEARING TIMER");
		}
		console.log("STARTING TIMER");
		this.meta.communicationCountDown = setTimeout(() => {
			console.log("TIMER DONE");
			this.meta.communication_status = 0;
			delete this.meta.communicationCountDown;
		}, process.env.COMMUNICATION_CHECK_INTERVAL);
	}
}

class EDDModel extends UnitModel {
	constructor(serial, parentSerial) {
		super(serial, parentSerial);

		this.data.type_id = 4;
		this.data.parent_type = 3;

		//status
		this.data.detonator_status = null;

		//bits
		this.data.bridge_wire = null;
		this.data.calibration = null;
		this.data.program = null;
		this.data.booster_fired_lfs = null;
		this.data.tagged = null;
		this.data.logged = null;
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
