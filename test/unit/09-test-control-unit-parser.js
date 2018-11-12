var assert = require("assert");

describe("parser-control-unit-parser-test", async function() {
	var MockHappn = require("../mocks/mock_happn");
	var DataParser = require("../../lib/parsers/deviceDataParser");
	const commTemplate = require("../../lib/constants/comm_templates");

	var mockHappn = new MockHappn();

	this.timeout(30000);

	it("can create a node result array with one set of node data from a parsed packet", async function() {
		const PacketModel = require("../../lib/models/packetModel");

		/*
         AAAA 0A 08 0001 00C0 CA96 (event on IBC-1 id 0001 - key switch armed on IBC)
         */
		var parser = null;
		parser = new DataParser();

		const packetTemplate = new commTemplate();
		let template = packetTemplate.incomingCommTemplate[8];

		let packet = "AAAA0A08000100C0CA96";
		var testObj = new PacketModel(template, packet, Date.now(), 0);

		var expected = [
			{
				serial: 1,
				type_id: 0,
				key_switch_status: 1,
				communication_status: 1,
				blast_armed: 0,
				fire_button: 0,
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
				parent_type: null,
				parent_serial: null,
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
				return Promise.reject(err);
			}
		};
		return test();
	});
});
