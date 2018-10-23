/**
 * Created by grant on 2016/06/17.
 */

var assert = require("assert");

describe("parser-edd-parser-test", async function() {
	const MockHappn = require("../mocks/mock_happn");
	const Utils = require("../../lib/utils/packet_utils");
	const UidDataListParser = require("../../lib/parsers/edd_data_parser");
	const Constants = require("../../lib/constants/command_constants");

	let mockHappn = new MockHappn();
	var parser = null;
	let utils = null;
	let commandConstant = null;

	this.timeout(30000);

	before("it sets up the dependencies", async function() {
		utils = new Utils();
		commandConstant = new Constants().incomingCommands[
			parseInt(0b00000100, 16)
		]; // command 3
		parser = new UidDataListParser(commandConstant);
	});

	it.only("can create a result array with nodes containing CBB & EDD data from a parsed packet", async function() {
		/*
		aaaa1c0400431b43e93c611b43e93d621b43e93e631b43e93f6414ac

         start  length  command   CBB serial    Data                    CRC
         AAAA   1C      05        0043          00001828ff00ff00        bf80
         */

		var expected = [
			{
				serial: 67,
				type_id: 3,
				key_switch_status: null,
				communication_status: 1,
				temperature: null,
				blast_armed: null,
				fire_button: null,
				isolation_relay: null,
				shaft_fault: null,
				cable_fault: null,
				earth_leakage: null,
				detonator_status: null,
				partial_blast_lfs: null,
				full_blast_lfs: null,
				booster_fired_lfs: null,
				missing_pulse_detected_lfs: null,
				AC_supply_voltage_lfs: null,
				DC_supply_voltage: null,
				DC_supply_voltage_status: null,
				mains: null,
				low_bat: null,
				too_low_bat: null,
				delay: null,
				program: null,
				calibration: null,
				det_fired: null,
				tagged: null,
				energy_storing: null,
				bridge_wire: null,
				parent_id: null,
				parent_type: 0,
				parent_serial: null,
				tree_parent_id: null,
				window_id: 0,
				crc: null,
				x: 0,
				y: 0
			},
			{
				serial: 457435452,
				type_id: 4,
				key_switch_status: null,
				communication_status: 1,
				temperature: null,
				blast_armed: null,
				fire_button: null,
				isolation_relay: null,
				shaft_fault: null,
				cable_fault: null,
				earth_leakage: null,
				detonator_status: null,
				partial_blast_lfs: null,
				full_blast_lfs: null,
				booster_fired_lfs: null,
				missing_pulse_detected_lfs: null,
				AC_supply_voltage_lfs: null,
				DC_supply_voltage: null,
				DC_supply_voltage_status: null,
				mains: null,
				low_bat: null,
				too_low_bat: null,
				delay: null,
				program: null,
				calibration: null,
				det_fired: null,
				tagged: null,
				energy_storing: null,
				bridge_wire: null,
				parent_id: null,
				parent_type: 3,
				parent_serial: 67,
				tree_parent_id: null,
				window_id: 97,
				crc: null,
				x: 0,
				y: 0
			},
			{
				serial: 457435453,
				type_id: 4,
				key_switch_status: null,
				communication_status: 1,
				temperature: null,
				blast_armed: null,
				fire_button: null,
				isolation_relay: null,
				shaft_fault: null,
				cable_fault: null,
				earth_leakage: null,
				detonator_status: null,
				partial_blast_lfs: null,
				full_blast_lfs: null,
				booster_fired_lfs: null,
				missing_pulse_detected_lfs: null,
				AC_supply_voltage_lfs: null,
				DC_supply_voltage: null,
				DC_supply_voltage_status: null,
				mains: null,
				low_bat: null,
				too_low_bat: null,
				delay: null,
				program: null,
				calibration: null,
				det_fired: null,
				tagged: null,
				energy_storing: null,
				bridge_wire: null,
				parent_id: null,
				parent_type: 3,
				parent_serial: 67,
				tree_parent_id: null,
				window_id: 98,
				crc: null,
				x: 0,
				y: 0
			},
			{
				serial: 457435454,
				type_id: 4,
				key_switch_status: null,
				communication_status: 1,
				temperature: null,
				blast_armed: null,
				fire_button: null,
				isolation_relay: null,
				shaft_fault: null,
				cable_fault: null,
				earth_leakage: null,
				detonator_status: null,
				partial_blast_lfs: null,
				full_blast_lfs: null,
				booster_fired_lfs: null,
				missing_pulse_detected_lfs: null,
				AC_supply_voltage_lfs: null,
				DC_supply_voltage: null,
				DC_supply_voltage_status: null,
				mains: null,
				low_bat: null,
				too_low_bat: null,
				delay: null,
				program: null,
				calibration: null,
				det_fired: null,
				tagged: null,
				energy_storing: null,
				bridge_wire: null,
				parent_id: null,
				parent_type: 3,
				parent_serial: 67,
				tree_parent_id: null,
				window_id: 99,
				crc: null,
				x: 0,
				y: 0
			},
			{
				serial: 457435455,
				type_id: 4,
				key_switch_status: null,
				communication_status: 1,
				temperature: null,
				blast_armed: null,
				fire_button: null,
				isolation_relay: null,
				shaft_fault: null,
				cable_fault: null,
				earth_leakage: null,
				detonator_status: null,
				partial_blast_lfs: null,
				full_blast_lfs: null,
				booster_fired_lfs: null,
				missing_pulse_detected_lfs: null,
				AC_supply_voltage_lfs: null,
				DC_supply_voltage: null,
				DC_supply_voltage_status: null,
				mains: null,
				low_bat: null,
				too_low_bat: null,
				delay: null,
				program: null,
				calibration: null,
				det_fired: null,
				tagged: null,
				energy_storing: null,
				bridge_wire: null,
				parent_id: null,
				parent_type: 3,
				parent_serial: 67,
				tree_parent_id: null,
				window_id: 100,
				crc: null,
				x: 0,
				y: 0
			}
		];

		let test = async () => {
			try {
				let packet = "aaaa1c0400431b43e93c611b43e93d621b43e93e631b43e93f6414ac";
				let testObj = await utils.splitPacket(packet);
				let parsedPacketArr = await parser.parse(mockHappn, testObj);
				let result = await parser.buildNodeData(mockHappn, parsedPacketArr);
				//console.log(result);
				await assert.deepEqual(result, expected);
			} catch (err) {
				return Promise.reject(err);
			}
		};

		return test();
	});

	it.only("can process an edd delete command", async function() {
		/*
		aaaa0d040043ffffffffff8a44

         start  length  command   CBB serial    Data                    CRC
         AAAA   1C      05        0043          00001828ff00ff00        bf80
         */

		var expected = [
			{
				serial: 67,
				type_id: 3,
				key_switch_status: null,
				communication_status: 1,
				temperature: null,
				blast_armed: null,
				fire_button: null,
				isolation_relay: null,
				shaft_fault: null,
				cable_fault: null,
				earth_leakage: null,
				detonator_status: null,
				partial_blast_lfs: null,
				full_blast_lfs: null,
				booster_fired_lfs: null,
				missing_pulse_detected_lfs: null,
				AC_supply_voltage_lfs: null,
				DC_supply_voltage: null,
				DC_supply_voltage_status: null,
				mains: null,
				low_bat: null,
				too_low_bat: null,
				delay: null,
				program: null,
				calibration: null,
				det_fired: null,
				tagged: null,
				energy_storing: null,
				bridge_wire: null,
				parent_id: null,
				parent_type: 0,
				parent_serial: null,
				tree_parent_id: null,
				window_id: 0,
				crc: null,
				x: 0,
				y: 0
			},
			{
				serial: 4294967295,
				type_id: 4,
				key_switch_status: null,
				communication_status: 1,
				temperature: null,
				blast_armed: null,
				fire_button: null,
				isolation_relay: null,
				shaft_fault: null,
				cable_fault: null,
				earth_leakage: null,
				detonator_status: null,
				partial_blast_lfs: null,
				full_blast_lfs: null,
				booster_fired_lfs: null,
				missing_pulse_detected_lfs: null,
				AC_supply_voltage_lfs: null,
				DC_supply_voltage: null,
				DC_supply_voltage_status: null,
				mains: null,
				low_bat: null,
				too_low_bat: null,
				delay: null,
				program: null,
				calibration: null,
				det_fired: null,
				tagged: null,
				energy_storing: null,
				bridge_wire: null,
				parent_id: null,
				parent_type: 3,
				parent_serial: 67,
				tree_parent_id: null,
				window_id: 255,
				crc: null,
				x: 0,
				y: 0
			}
		];

		let test = async () => {
			try {
				let packet = "aaaa0d040043ffffffffff8a44";
				let testObj = await utils.splitPacket(packet);
				let parsedPacketArr = await parser.parse(mockHappn, testObj);
				let result = await parser.buildNodeData(mockHappn, parsedPacketArr);
				//console.log(result);
				await assert.deepEqual(result, expected);
			} catch (err) {
				return Promise.reject(err);
			}
		};

		return test();
	});
});
