/**
 * Created by grant on 2016/06/17.
 */

var assert = require("assert");

describe("cbb-parser-test", async function() {
	const MockHappn = require("../mocks/mock_happn");
	const Utils = require("../../lib/utils/packet_utils");
	const UidDataListParser = require("../../lib/parsers/uid_list_parser");
	const Constants = require("../../lib/constants/command_constants");

	let mockHappn = new MockHappn();
	var parser = null;
	let utils = null;
	let commandConstant = null;

	this.timeout(30000);

	before("it sets up the dependencies", async function() {
		utils = new Utils();
		// command 3
		commandConstant = new Constants().incomingCommands[
			parseInt(0b00000100, 16)
		];
		parser = new UidDataListParser(commandConstant);
	});

	it("can create a result array with nodes containing CBB and EDD data from a parsed packet", async function() {
		/*
		aaaa1c0400431b43e93c611b43e93d621b43e93e631b43e93f6414ac

         start  length  command CBB serial  Data                                      data  CRC
         AAAA   1C      04      0043        1b43e93c611b43e93d621b43e93e631b43e93f64        14ac
         */

		// NOTE: top-level IBC does not have a parent_id (ie: null)
		// NOTE: IB651 serial is unknown (ie: null) - this will ultimately be retrieved from the DB

		var expected = [
			{
				serial: 67,
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
				parent_serial: null,
				tree_parent_id: null,
				window_id: null,
				crc: null,
				x: 0,
				y: 0
			},
			{
				serial: 6184,
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
				parent_serial: 67,
				tree_parent_id: null,
				window_id: 255,
				crc: null,
				x: 0,
				y: 0
			},
			{
				serial: 65280,
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
				parent_serial: 67,
				tree_parent_id: null,
				window_id: 0,
				crc: null,
				x: 0,
				y: 0
			}
		];

		let test = async () => {
			try {
				let packet =
					"aaaa440400431b4c9ac3551b4c9ac4561b4c9ac5571b4c9ac6581b4c9ac7591b4c9ac85a1b4c9ac95b1b4c9aca5c1b4c9b305d1b4c9b315e1b4c9b325f1b43e93b60ab78";
				let testObj = await utils.splitPacket(packet);

				let parsedPacketArr = await parser.parse(mockHappn, testObj);

				let result = await parser.buildNodeData(mockHappn, parsedPacketArr);
				await assert.deepEqual(result, expected);
			} catch (err) {
				console.log("error ", err);
				return Promise.reject(err);
			}
		};

		return test();
	});
});
