var assert = require("assert");

describe("parser-CBB_LIST-parser-test", async function() {
	const MockHappn = require("../mocks/mock_happn");
	var DataListParser = require("../../lib/parsers/deviceListParser");
	const PacketTemplate = require("../../lib/constants/packetTemplates");
	const PacketModel = require("../../lib/models/packetModel");

	let mockHappn = new MockHappn();

	this.timeout(30000);

	before("it sets up the dependencies", async function() {});

	it("can create a result array with nodes containing CBB and EDD data from a parsed packet", async function() {
		var expected = [
			{
				serial: 67,
				parent_serial: null,
				type_id: 3,
				parent_type: 0,
				parent_id: null,
				window_id: 4,
				communication_status: 1,
				blast_armed: null,
				key_switch_status: null,
				isolation_relay: null,
				mains: null,
				low_bat: null,
				too_low_bat: null,
				DC_supply_voltage_status: null,
				shaft_fault: null,
				cable_fault: null,
				earth_leakage: null
			},
			{
				serial: 457435452,
				parent_serial: 67,
				type_id: 4,
				parent_type: 3,
				parent_id: null,
				window_id: 97,
				detonator_status: null,
				bridge_wire: null,
				calibration: null,
				program: null,
				booster_fired_lfs: null,
				tagged: null,
				logged: null
			},
			{
				serial: 457435453,
				parent_serial: 67,
				type_id: 4,
				parent_type: 3,
				parent_id: null,
				window_id: 98,
				detonator_status: null,
				bridge_wire: null,
				calibration: null,
				program: null,
				booster_fired_lfs: null,
				tagged: null,
				logged: null
			},
			{
				serial: 457435454,
				parent_serial: 67,
				type_id: 4,
				parent_type: 3,
				parent_id: null,
				window_id: 99,
				detonator_status: null,
				bridge_wire: null,
				calibration: null,
				program: null,
				booster_fired_lfs: null,
				tagged: null,
				logged: null
			},
			{
				serial: 457435455,
				parent_serial: 67,
				type_id: 4,
				parent_type: 3,
				parent_id: null,
				window_id: 100,
				detonator_status: null,
				bridge_wire: null,
				calibration: null,
				program: null,
				booster_fired_lfs: null,
				tagged: null,
				logged: null
			}
		];

		let test = async () => {
			try {
				const parser = new DataListParser();
				const packetTemplate = new PacketTemplate();

				let template = packetTemplate.incomingCommTemplate[4];

				let packet = "aaaa1c0400431b43e93c611b43e93d621b43e93e631b43e93f6414ac";
				var testObj = new PacketModel(template, packet, Date.now(), 0);

				let parsedPacketArr = await parser.parse(mockHappn, testObj);

				let result = await parser.buildNodeData(mockHappn, parsedPacketArr);

				result.forEach(item => {
					delete item.storedPacketDate;
					delete item.modified;
					delete item.created;
					delete item.led_state;
				});
				await assert.deepEqual(result, expected);
			} catch (err) {
				return Promise.reject(err);
			}
		};

		return test();
	});
});
