class UnitModel {
	constructor(serial, parentSerial) {
		//Identifiers -- these are shared between all types
		this.id = null;
		this.serial = serial;
		this.parent_serial = parentSerial;

		this.type_id = null;
		this.parent_type = null;

		this.parent_id = null;
		this.window_id = null;

		this.storedPacketDate = null;
		this.created = null;
		this.modified = null;
	}
}

class ControlUnitModel extends UnitModel {
	constructor(serial, parentSerial) {
		super(serial, parentSerial);
		this.type_id = 0;

		//status
		this.communication_status = 1;

		//bits
		this.key_switch_status = null;
		this.fire_button = null;
		this.cable_fault = null;
		this.isolation_relay = null;
		this.earth_leakage = null;
		this.blast_armed = null;
	}
}

class SectionControlModel extends UnitModel {
	constructor(serial, parentSerial) {
		super(serial, parentSerial);

		this.type_id = 1;
		this.parent_type = 0;

		//status
		this.communication_status = 1;

		//bits
		this.key_switch_status = null;
		this.cable_fault = null;
		this.isolation_relay = null;
		this.earth_leakage = null;
		this.blast_armed = null;
	}
}

class BoosterModel extends UnitModel {
	constructor(serial, parentSerial) {
		super(serial, parentSerial);

		this.type_id = 2;
		this.parent_type = 1;

		//status
		this.communication_status = 1;

		//bits
		this.key_switch_status = null;
		this.detonator_status = null;

		this.booster_fired_lfs = null;
		this.partial_blast_lfs = null;
		this.missing_pulse_detected_lfs = null;

		this.DC_supply_voltage = null;
		this.mains = null;
	}
}

class CBoosterModel extends UnitModel {
	constructor(serial, parentSerial) {
		super(serial, parentSerial);

		this.type_id = 3;
		this.parent_type = 0;

		//status
		this.communication_status = 1;

		//bits
		this.blast_armed = null;

		this.key_switch_status = null;
		this.isolation_relay = null;

		this.mains = null;
		this.low_bat = null;
		this.too_low_bat = null;
		this.DC_supply_voltage_status = null;

		this.shaft_fault = null;
		this.cable_fault = null;
		this.earth_leakage = null;
		this.led_state = null;
	}
}

class EDDModel extends UnitModel {
	constructor(serial, parentSerial) {
		super(serial, parentSerial);

		this.type_id = 4;
		this.parent_type = 3;

		//status
		this.detonator_status = null;

		//bits
		this.bridge_wire = null;
		this.calibration = null;
		this.program = null;
		this.booster_fired_lfs = null;
		this.tagged = null;
		this.logged = null;
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
