class UnitModel {
	constructor() {
		this.serial = null;
		this.type_id = null;
		this.key_switch_status = null;
		this.communication_status = 1;
		this.blast_armed = null; //ready State for AB-1
		this.fire_button = null;
		this.isolation_relay = null;
		this.shaft_fault = null;
		this.cable_fault = null;
		this.earth_leakage = null;
		this.detonator_status = null;
		this.partial_blast_lfs = null; //det Error for AB-1
		this.full_blast_lfs = null;
		this.booster_fired_lfs = null;
		this.missing_pulse_detected_lfs = null;
		this.AC_supply_voltage_lfs = null;
		this.DC_supply_voltage = null;
		this.DC_supply_voltage_status = null;
		this.mains = null;
		this.low_bat = null;
		this.too_low_bat = null;
		this.delay = null;
		this.program = null;
		this.calibration = null;
		this.det_fired = null;
		this.tagged = null;
		this.energy_storing = null;
		this.bridge_wire = null;
		this.parent_id = null;
		this.parent_type = null;
		this.parent_serial = null;
		this.tree_parent_id = null;
		this.window_id = null;
		this.crc = null;
		this.x = 0;
		this.y = 0;
	}
}

module.exports = { UnitModel };
