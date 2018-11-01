function DataMapper() {
	this.__instance = null;
}
DataMapper.prototype.mapInsertPacket = function(packet) {
	const {
		data,
		complete,
		start,
		length,
		command: pcommand,
		serial: pserial
	} = packet;

	return new Promise(resolve => {
		resolve({
			message: complete,
			start: start,
			length: length,
			command: pcommand,
			serial: pserial,
			data_device_type: data != null ? data.deviceType : null,
			data_device_id: data != null ? data.deviceId : null,
			data_raw_bit_0: data != null ? data.raw[0] : null,
			data_raw_bit_1: data != null ? data.raw[1] : null,
			data_raw_bit_2: data != null ? data.raw[2] : null,
			data_raw_bit_3: data != null ? data.raw[3] : null,
			data_raw_bit_4: data != null ? data.raw[4] : null,
			data_raw_bit_5: data != null ? data.raw[5] : null,
			data_raw_bit_6: data != null ? data.raw[6] : null,
			data_raw_bit_7: data != null ? data.raw[7] : null,
			crc: packet.crc,
			created_at: null
		});
	});
};

/***
 * @summary handle the node update Mapping
 * @param parsedPacket - parse packet
 * @param foundResult - record from database
 */
DataMapper.prototype.mapUpdateNode = function(parsedPacket, foundResult) {
	let mapAsync = async () => {
		parsedPacket.id = foundResult.id;
		try {
			foundResult.serial = parseInt(foundResult.serial);
			//compare the incoming with the db values and report the changed values
			let compareResult = await this.checkDifference(parsedPacket, foundResult);
			let changes = Object.entries(compareResult).filter(
				x =>
					x[1]["incoming"] !== undefined &&
					x[1]["incoming"] !== null &&
					x[1]["existing"] !== undefined &&
					x[0] != "y" &&
					x[0] != "x"
			);
			if (changes.length > 0) {
				foundResult.dirty = changes;
			}
			// console.log(
			// 	`changes ${JSON.stringify(changes)} to serial ${
			// 		parsedPacket.serial
			// 	} of type ${parsedPacket.type_id}`
			// );
		} catch (err) {
			console.log("error", err);
			return Promise.reject(err);
		}

		if (parsedPacket.type_id != null || parsedPacket.type_id != undefined) {
			foundResult.type_id = parsedPacket.type_id;
		}
		if (
			parsedPacket.key_switch_status != null ||
			parsedPacket.key_switch_status != undefined
		) {
			foundResult.key_switch_status = parsedPacket.key_switch_status;
		}
		if (
			parsedPacket.communication_status != null ||
			parsedPacket.communication_status != undefined
		)
			foundResult.communication_status = parsedPacket.communication_status;
		if (
			parsedPacket.blast_armed != null ||
			parsedPacket.blast_armed != undefined
		) {
			foundResult.blast_armed = parsedPacket.blast_armed;
		}
		if (
			parsedPacket.fire_button != null ||
			parsedPacket.fire_button != undefined
		) {
			foundResult.fire_button = parsedPacket.fire_button;
		}
		if (
			parsedPacket.isolation_relay != null ||
			parsedPacket.isolation_relay != undefined
		) {
			foundResult.isolation_relay = parsedPacket.isolation_relay;
		}
		if (
			parsedPacket.shaft_fault != null ||
			parsedPacket.shaft_fault != undefined
		) {
			foundResult.shaft_fault = parsedPacket.shaft_fault;
		}
		if (
			parsedPacket.cable_fault != null ||
			parsedPacket.cable_fault != undefined
		) {
			foundResult.cable_fault = parsedPacket.cable_fault;
		}
		if (
			parsedPacket.earth_leakage != null ||
			parsedPacket.earth_leakage != undefined
		) {
			foundResult.earth_leakage = parsedPacket.earth_leakage;
		}
		if (
			parsedPacket.detonator_status != null ||
			parsedPacket.detonator_status != undefined
		) {
			foundResult.detonator_status = parsedPacket.detonator_status;
		}
		if (
			parsedPacket.partial_blast_lfs != null ||
			parsedPacket.partial_blast_lfs != undefined
		) {
			foundResult.partial_blast_lfs = parsedPacket.partial_blast_lfs;
		}
		if (
			parsedPacket.full_blast_lfs != null ||
			parsedPacket.full_blast_lfs != undefined
		) {
			foundResult.full_blast_lfs = parsedPacket.full_blast_lfs;
		}
		if (
			parsedPacket.booster_fired_lfs != null ||
			parsedPacket.booster_fired_lfs != undefined
		) {
			foundResult.booster_fired_lfs = parsedPacket.booster_fired_lfs;
		}
		if (
			parsedPacket.missing_pulse_detected_lfs != null ||
			parsedPacket.missing_pulse_detected_lfs != undefined
		) {
			foundResult.missing_pulse_detected_lfs =
				parsedPacket.missing_pulse_detected_lfs;
		}
		if (
			parsedPacket.AC_supply_voltage_lfs != null ||
			parsedPacket.AC_supply_voltage_lfs != undefined
		) {
			foundResult.AC_supply_voltage_lfs = parsedPacket.AC_supply_voltage_lfs;
		}
		if (
			parsedPacket.DC_supply_voltage != null ||
			parsedPacket.DC_supply_voltage != undefined
		) {
			foundResult.DC_supply_voltage = parsedPacket.DC_supply_voltage;
		}
		if (
			parsedPacket.DC_supply_voltage_status != null ||
			parsedPacket.DC_supply_voltage_status != undefined
		) {
			foundResult.DC_supply_voltage_status =
				parsedPacket.DC_supply_voltage_status;
		}
		if (parsedPacket.mains != null || parsedPacket.mains != undefined) {
			foundResult.mains = parsedPacket.mains;
		}
		if (parsedPacket.low_bat != null || parsedPacket.low_bat != undefined) {
			foundResult.low_bat = parsedPacket.low_bat;
		}
		if (
			parsedPacket.too_low_bat != null ||
			parsedPacket.too_low_bat != undefined
		) {
			foundResult.too_low_bat = parsedPacket.too_low_bat;
		}
		if (parsedPacket.delay != null || parsedPacket.delay != undefined) {
			foundResult.delay = parsedPacket.delay;
		}
		if (parsedPacket.program != null || parsedPacket.program != undefined) {
			foundResult.program = parsedPacket.program;
		}
		if (
			parsedPacket.calibration != null ||
			parsedPacket.calibration != undefined
		) {
			foundResult.calibration = parsedPacket.calibration;
		}
		if (parsedPacket.det_fired != null || parsedPacket.det_fired != undefined) {
			foundResult.det_fired = parsedPacket.det_fired;
		}
		if (parsedPacket.tagged != null || parsedPacket.tagged != undefined) {
			foundResult.tagged = parsedPacket.tagged;
		}
		if (
			parsedPacket.energy_storing != null ||
			parsedPacket.energy_storing != undefined
		) {
			foundResult.energy_storing = parsedPacket.energy_storing;
		}
		if (
			parsedPacket.bridge_wire != null ||
			parsedPacket.bridge_wire != undefined
		) {
			foundResult.bridge_wire = parsedPacket.bridge_wire;
		}
		if (parsedPacket.parent_id != null || parsedPacket.parent_id != undefined) {
			foundResult.parent_id = parsedPacket.parent_id;
		}
		if (
			parsedPacket.parent_serial != null ||
			parsedPacket.parent_serial != undefined
		) {
			foundResult.parent_serial = parsedPacket.parent_serial;
		}
		if (
			parsedPacket.parent_type != null ||
			parsedPacket.parent_type != undefined
		)
			foundResult.parent_type = parsedPacket.parent_type;
		if (parsedPacket.window_id != null || parsedPacket.window_id != undefined) {
			foundResult.window_id = parsedPacket.window_id;
		}
		if (parsedPacket.delay != null || parsedPacket.delay != undefined) {
			foundResult.delay = parsedPacket.delay;
		}
		if (parsedPacket.serial != null || parsedPacket.serial != undefined) {
			foundResult.serial = parsedPacket.serial;
		}
		return foundResult;
	};
	return mapAsync();
};

/***
 * @summary check the difference betweein two ojects
 * @param parsedPacket - parse packet
 * @param foundResult - record from database
 */
DataMapper.prototype.checkDifference = function(leftObj, rightObj) {
	let checkDifAsync = async () => {
		const empty = {};
		const isObject = x => Object(x) === x;
		try {
			const diff1 = (left = {}, right = {}, rel = "incoming") =>
				Object.entries(left)
					.map(
						([k, v]) =>
							isObject(v) && isObject(right[k])
								? [k, diff1(v, right[k], rel)]
								: right[k] !== v
									? [k, { [rel]: v }]
									: [k, empty]
					)
					.reduce(
						(acc, [k, v]) => (v === empty ? acc : { ...acc, [k]: v }),
						empty
					);
			const merge = (left = {}, right = {}) =>
				Object.entries(right).reduce(
					(acc, [k, v]) =>
						isObject(v) && isObject(left[k])
							? { ...acc, [k]: merge(left[k], v) }
							: { ...acc, [k]: v },
					left
				);
			const diff = (x = {}, y = {}) =>
				merge(diff1(x, y, "incoming"), diff1(y, x, "existing"));
			let result = diff(leftObj, rightObj);
			// console.log(result);
			return result;
		} catch (err) {
			console.log(err);
			return Promise.reject(err);
		}
	};
	return checkDifAsync();
};

module.exports = DataMapper;
