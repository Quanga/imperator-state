/**
 * Created by grant on 2016/06/17.
 */

var assert = require("assert");

describe("serial-list-parser-test", function() {
	var MockHappn = require("../mocks/mock_happn");
	var Utils = require("../../lib/utils/packet_utils");
	var SerialListParser = require("../../lib/parsers/serial_list_parser");
	var Constants = require("../../lib/constants/command_constants");

	var mockHappn = new MockHappn();
	var parser = null;
	var utils = null;
	var commandConstant = null;

	this.timeout(30000);

	before("it sets up the dependencies", function(callback) {
		utils = new Utils();
		commandConstant = new Constants().ibcToPiCommands[parseInt(0b00000001, 16)]; // command 1
		parser = new SerialListParser(commandConstant);

		callback();
	});

	it("can create a result array with ISC list from a parsed packet", function() {
		/*
         ISC serial list for IBC id 8

         start  length  command serial  isc1    isc2    isc3    isc4    isc5    isc6    isc7    crc
         AAAA   16      01      0008    0025    0026    002E    0032    002A    0012    002C    7BCA
         */

		var packet = "AAAA1601000800250026002E0032002A0012002C7BCA";
		var testObj = utils.splitPacket(packet);

		var expected = [
			{
				serial: 8,
				type_id: 0,
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
				window_id: 7,
				crc: null,
				x: 0,
				y: 0
			},
			{
				serial: 37,
				type_id: 1,
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
				parent_serial: 8,
				tree_parent_id: null,
				window_id: null,
				crc: null,
				x: 0,
				y: 0
			},
			{
				serial: 38,
				type_id: 1,
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
				parent_serial: 8,
				tree_parent_id: null,
				window_id: null,
				crc: null,
				x: 0,
				y: 0
			},
			{
				serial: 46,
				type_id: 1,
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
				parent_serial: 8,
				tree_parent_id: null,
				window_id: null,
				crc: null,
				x: 0,
				y: 0
			},
			{
				serial: 50,
				type_id: 1,
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
				parent_serial: 8,
				tree_parent_id: null,
				window_id: null,
				crc: null,
				x: 0,
				y: 0
			},
			{
				serial: 42,
				type_id: 1,
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
				parent_serial: 8,
				tree_parent_id: null,
				window_id: null,
				crc: null,
				x: 0,
				y: 0
			},
			{
				serial: 18,
				type_id: 1,
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
				parent_serial: 8,
				tree_parent_id: null,
				window_id: null,
				crc: null,
				x: 0,
				y: 0
			},
			{
				serial: 44,
				type_id: 1,
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
				parent_serial: 8,
				tree_parent_id: null,
				window_id: null,
				crc: null,
				x: 0,
				y: 0
			}
		];

		let test = async () => {
			try {
				let parsedPacketArr = await parser.parse(mockHappn, testObj);

				let result = await parser.buildNodeData(mockHappn, parsedPacketArr);

				assert.deepEqual(result, expected);
			} catch (err) {
				console.log("error", err);
			}
		};

		return test();
	});
});
