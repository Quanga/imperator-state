/**
 * Created by grant on 2016/08/06.
 */

function DataMapper() {
	this.__instance = null;
}

DataMapper.prototype.mapInsertPacket = function(packet) {
	return new Promise(resolve => {
		resolve({
			message: packet.complete,
			start: packet.start,
			length: packet.length,
			command: packet.command,
			serial: packet.serial,
			data_device_type: packet.data != null ? packet.data.deviceType : null,
			data_device_id: packet.data != null ? packet.data.deviceId : null,
			data_raw_bit_0: packet.data != null ? packet.data.raw[0] : null,
			data_raw_bit_1: packet.data != null ? packet.data.raw[1] : null,
			data_raw_bit_2: packet.data != null ? packet.data.raw[2] : null,
			data_raw_bit_3: packet.data != null ? packet.data.raw[3] : null,
			data_raw_bit_4: packet.data != null ? packet.data.raw[4] : null,
			data_raw_bit_5: packet.data != null ? packet.data.raw[5] : null,
			data_raw_bit_6: packet.data != null ? packet.data.raw[6] : null,
			data_raw_bit_7: packet.data != null ? packet.data.raw[7] : null,
			crc: packet.crc,
			created_at: null
		});
	});
};

DataMapper.prototype.mapUpdateNode = function(parsedPacket, foundResult) {
	return new Promise(resolve => {
		parsedPacket.id = foundResult.id;

		if (parsedPacket.type_id != null)
			foundResult.type_id = parsedPacket.type_id;
		if (parsedPacket.key_switch_status != null)
			foundResult.key_switch_status = parsedPacket.key_switch_status;
		if (parsedPacket.communication_status)
			foundResult.communication_status = parsedPacket.communication_status;
		if (parsedPacket.temperature != null)
			foundResult.temperature = parsedPacket.temperature;
		if (parsedPacket.blast_armed != null)
			foundResult.blast_armed = parsedPacket.blast_armed;
		if (parsedPacket.fire_button != null)
			foundResult.fire_button = parsedPacket.fire_button;
		if (parsedPacket.isolation_relay != null)
			foundResult.isolation_relay = parsedPacket.isolation_relay;
		if (parsedPacket.shaft_fault != null)
			foundResult.shaft_fault = parsedPacket.shaft_fault;
		if (parsedPacket.cable_fault != null)
			foundResult.cable_fault = parsedPacket.cable_fault;
		if (parsedPacket.earth_leakage != null)
			foundResult.earth_leakage = parsedPacket.earth_leakage;
		if (parsedPacket.detonator_status != null)
			foundResult.detonator_status = parsedPacket.detonator_status;
		if (parsedPacket.partial_blast_lfs != null)
			foundResult.partial_blast_lfs = parsedPacket.partial_blast_lfs;
		if (parsedPacket.full_blast_lfs != null)
			foundResult.full_blast_lfs = parsedPacket.full_blast_lfs;
		if (parsedPacket.booster_fired_lfs != null)
			foundResult.booster_fired_lfs = parsedPacket.booster_fired_lfs;
		if (parsedPacket.missing_pulse_detected_lfs != null)
			foundResult.missing_pulse_detected_lfs =
				parsedPacket.missing_pulse_detected_lfs;
		if (parsedPacket.AC_supply_voltage_lfs != null)
			foundResult.AC_supply_voltage_lfs = parsedPacket.AC_supply_voltage_lfs;
		if (parsedPacket.DC_supply_voltage != null)
			foundResult.DC_supply_voltage = parsedPacket.DC_supply_voltage;
		if (parsedPacket.DC_supply_voltage_status != null)
			foundResult.DC_supply_voltage_status =
				parsedPacket.DC_supply_voltage_status;
		if (parsedPacket.mains != null) foundResult.mains = parsedPacket.mains;
		if (parsedPacket.low_bat != null)
			foundResult.low_bat = parsedPacket.low_bat;
		if (parsedPacket.too_low_bat != null)
			foundResult.too_low_bat = parsedPacket.too_low_bat;
		if (parsedPacket.delay != null) foundResult.delay = parsedPacket.delay;
		if (parsedPacket.program != null)
			foundResult.program = parsedPacket.program;
		if (parsedPacket.calibration != null)
			foundResult.calibration = parsedPacket.calibration;
		if (parsedPacket.det_fired != null)
			foundResult.det_fired = parsedPacket.det_fired;
		if (parsedPacket.tagged != null) foundResult.tagged = parsedPacket.tagged;
		if (parsedPacket.energy_storing != null)
			foundResult.energy_storing = parsedPacket.energy_storing;
		if (parsedPacket.bridge_wire != null)
			foundResult.bridge_wire = parsedPacket.bridge_wire;
		if (parsedPacket.parent_id != null)
			foundResult.parent_id = parsedPacket.parent_id;
		if (parsedPacket.parent_serial != null)
			foundResult.parent_serial = parsedPacket.parent_serial;
		if (parsedPacket.parent_type != null)
			foundResult.parent_type = parsedPacket.parent_type;
		if (parsedPacket.tree_parent_id != null)
			foundResult.tree_parent_id = parsedPacket.tree_parent_id;
		if (parsedPacket.window_id != null)
			foundResult.window_id = parsedPacket.window_id;
		if (parsedPacket.delay != null) foundResult.delay = parsedPacket.delay;

		if (parsedPacket.serial != null) foundResult.serial = parsedPacket.serial;

		resolve(foundResult);
	});
};

module.exports = DataMapper;
