/**
 * Created by grant on 2016/06/17.
 */

var assert = require("assert");

describe("data-list-parser-test", function() {
	const MockHappn = require("../mocks/mock_happn");
	const Utils = require("../../lib/utils/packet_utils");
	const DataListParser = require("../../lib/parsers/data_list_parser");
	const Constants = require("../../lib/constants/command_constants");

	let mockHappn = new MockHappn();
	var parser = null;
	let utils = null;
	let commandConstant = null;

	this.timeout(30000);

	before("it sets up the dependencies", function(callback) {
		utils = new Utils();
		commandConstant = new Constants().ibcToPiCommands[parseInt(0b00000011, 16)]; // command 3
		parser = new DataListParser(commandConstant);

		callback();
	});

	it("can create a result array with nodes containing ISC and IB651 data from a parsed packet", function() {
		/*
         start  length  command ISC serial  ISC data    IB651 data  CRC
         AAAA   0C      03      0004        4040        210E        CAF6
         */

		var packet = "AAAA0C0300044040210ECAF6";
		var testObj = utils.splitPacket(packet);

		// NOTE: top-level IBC does not have a parent_id (ie: null)
		// NOTE: IB651 serial is unknown (ie: null) - this will ultimately be retrieved from the DB
		var expected = [
			{
				serial: 4,
				type_id: 1,
				key_switch_status: 0,
				communication_status: 1,
				temperature: null,
				blast_armed: 0,
				fire_button: null,
				isolation_relay: 1,
				shaft_fault: null,
				cable_fault: 0,
				earth_leakage: 0,
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
				parent_type: undefined,
				parent_serial: null,
				tree_parent_id: null,
				window_id: null,
				crc: null,
				x: 0,
				y: 0
			},
			{
				serial: null,
				type_id: 2,
				key_switch_status: 0,
				communication_status: 1,
				temperature: null,
				blast_armed: null,
				fire_button: null,
				isolation_relay: null,
				shaft_fault: null,
				cable_fault: null,
				earth_leakage: null,
				detonator_status: 1,
				partial_blast_lfs: 0,
				full_blast_lfs: null,
				booster_fired_lfs: 0,
				missing_pulse_detected_lfs: 0,
				AC_supply_voltage_lfs: null,
				DC_supply_voltage: 0,
				DC_supply_voltage_status: null,
				mains: 0,
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
				parent_type: 1,
				parent_serial: 4,
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
				console.log("error ", err);
			}
		};

		return test();
	});
});
