var assert = require("assert");

describe("parser-CBB_DATA-parser-test", async function() {
	const MockHappn = require("../mocks/mock_happn");
	let mockHappn = new MockHappn();

	this.timeout(30000);

	it.only("can create a result array with nodes containing CBB & EDD data from a parsed packet", async function() {
		/*

         start  length  command   CBB serial    Data                    CRC
         AAAA   1C      05        0043          00001828ff00ff00        bf80
         */

		var expected = [
			{
				serial: 67,
				parent_serial: null,
				type_id: 3,
				parent_type: 0,
				parent_id: null,
				window_id: 100,
				communication_status: 1,
				blast_armed: 0,
				key_switch_status: 1,
				isolation_relay: 0,
				mains: 0,
				low_bat: 0,
				too_low_bat: 0,
				DC_supply_voltage_status: 1,
				shaft_fault: 0,
				cable_fault: 0,
				earth_leakage: 0
			},
			{
				serial: null,
				parent_serial: 67,
				type_id: 4,
				parent_type: 3,
				parent_id: null,
				window_id: 16,
				detonator_status: 0,
				bridge_wire: 0,
				calibration: 0,
				program: 0,
				booster_fired_lfs: 0,
				tagged: 0,
				logged: 1,
				delay: 1500
			},
			{
				serial: null,
				parent_serial: 67,
				type_id: 4,
				parent_type: 3,
				parent_id: null,
				window_id: 17,
				detonator_status: 0,
				bridge_wire: 0,
				calibration: 0,
				program: 0,
				booster_fired_lfs: 0,
				tagged: 0,
				logged: 1,
				delay: 1600
			},
			{
				serial: null,
				parent_serial: 67,
				type_id: 4,
				parent_type: 3,
				parent_id: null,
				window_id: 18,
				detonator_status: 0,
				bridge_wire: 0,
				calibration: 0,
				program: 0,
				booster_fired_lfs: 0,
				tagged: 0,
				logged: 1,
				delay: 1700
			},
			{
				serial: null,
				parent_serial: 67,
				type_id: 4,
				parent_type: 3,
				parent_id: null,
				window_id: 19,
				detonator_status: 0,
				bridge_wire: 0,
				calibration: 0,
				program: 0,
				booster_fired_lfs: 0,
				tagged: 0,
				logged: 1,
				delay: 1800
			},
			{
				serial: null,
				parent_serial: 67,
				type_id: 4,
				parent_type: 3,
				parent_id: null,
				window_id: 20,
				detonator_status: 0,
				bridge_wire: 0,
				calibration: 0,
				program: 0,
				booster_fired_lfs: 0,
				tagged: 0,
				logged: 1,
				delay: 1900
			},
			{
				serial: null,
				parent_serial: 67,
				type_id: 4,
				parent_type: 3,
				parent_id: null,
				window_id: 21,
				detonator_status: 0,
				bridge_wire: 0,
				calibration: 0,
				program: 0,
				booster_fired_lfs: 0,
				tagged: 0,
				logged: 1,
				delay: 2000
			},
			{
				serial: null,
				parent_serial: 67,
				type_id: 4,
				parent_type: 3,
				parent_id: null,
				window_id: 22,
				detonator_status: 0,
				bridge_wire: 0,
				calibration: 0,
				program: 0,
				booster_fired_lfs: 0,
				tagged: 0,
				logged: 1,
				delay: 2100
			},
			{
				serial: null,
				parent_serial: 67,
				type_id: 4,
				parent_type: 3,
				parent_id: null,
				window_id: 23,
				detonator_status: 0,
				bridge_wire: 0,
				calibration: 0,
				program: 0,
				booster_fired_lfs: 0,
				tagged: 0,
				logged: 1,
				delay: 2200
			},
			{
				serial: null,
				parent_serial: 67,
				type_id: 4,
				parent_type: 3,
				parent_id: null,
				window_id: 24,
				detonator_status: 0,
				bridge_wire: 0,
				calibration: 0,
				program: 0,
				booster_fired_lfs: 0,
				tagged: 0,
				logged: 1,
				delay: 2300
			},
			{
				serial: null,
				parent_serial: 67,
				type_id: 4,
				parent_type: 3,
				parent_id: null,
				window_id: 25,
				detonator_status: 0,
				bridge_wire: 0,
				calibration: 0,
				program: 0,
				booster_fired_lfs: 0,
				tagged: 0,
				logged: 1,
				delay: 2400
			},
			{
				serial: null,
				parent_serial: 67,
				type_id: 4,
				parent_type: 3,
				parent_id: null,
				window_id: 26,
				detonator_status: 0,
				bridge_wire: 0,
				calibration: 0,
				program: 0,
				booster_fired_lfs: 0,
				tagged: 0,
				logged: 1,
				delay: 2500
			},
			{
				serial: null,
				parent_serial: 67,
				type_id: 4,
				parent_type: 3,
				parent_id: null,
				window_id: 27,
				detonator_status: 0,
				bridge_wire: 0,
				calibration: 0,
				program: 0,
				booster_fired_lfs: 0,
				tagged: 0,
				logged: 1,
				delay: 2600
			},
			{
				serial: null,
				parent_serial: 67,
				type_id: 4,
				parent_type: 3,
				parent_id: null,
				window_id: 28,
				detonator_status: 0,
				bridge_wire: 0,
				calibration: 0,
				program: 0,
				booster_fired_lfs: 0,
				tagged: 0,
				logged: 1,
				delay: 2700
			},
			{
				serial: null,
				parent_serial: 67,
				type_id: 4,
				parent_type: 3,
				parent_id: null,
				window_id: 29,
				detonator_status: 0,
				bridge_wire: 0,
				calibration: 0,
				program: 0,
				booster_fired_lfs: 0,
				tagged: 0,
				logged: 1,
				delay: 2800
			},
			{
				serial: null,
				parent_serial: 67,
				type_id: 4,
				parent_type: 3,
				parent_id: null,
				window_id: 30,
				detonator_status: 0,
				bridge_wire: 0,
				calibration: 0,
				program: 0,
				booster_fired_lfs: 0,
				tagged: 0,
				logged: 1,
				delay: 2900
			}
		];

		let test = async () => {
			try {
				const DataParser = require("../../lib/parsers/deviceDataParser");
				const PacketModel = require("../../lib/models/packetModel");
				const PacketTemplate = require("../../lib/constants/packetTemplates");

				const parser = new DataParser();
				const packetTemplate = new PacketTemplate();

				let template = packetTemplate.incomingCommTemplate[5];
				//let packet = "aaaa0c05004364001828be81";
				// let packet =
				// 	"aaaa4805004364008a291001dc05110140061201a4061301080714016c071501d00716013408170198081801fc08190160091a01c4091b01280a1c018c0a1d01f00a1e01540b5c32";
				// let packet =
				// 	"aaaa4805004364000a292e0194112f01f81130015c123101c01232012413330188133401ec13350150143601b4143701181538017c153901e0153a0144163b01a8163c010c17639d";
				// let packet =
				// 	"aaaa4805004364000a291f01b80b20011c0c2101800c2201e40c2301480d2401ac0d2501100e2601740e2701d80e28013c0f2901a00f2a0104102b0168102c01cc102d0130114a5d";
				let packet =
					"aaaa4805004364008a211001dc05110140061201a4061301080714016c071501d00716013408170198081801fc08190160091a01c4091b01280a1c018c0a1d01f00a1e01540b8f97";

				var testObj = new PacketModel(template, packet, Date.now(), 0);
				let parsedPacketArr = await parser.parse(mockHappn, testObj);
				let result = await parser.buildNodeData(mockHappn, parsedPacketArr);
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
				parent_serial: null,
				type_id: 3,
				parent_type: 0,
				parent_id: null,
				window_id: 1,
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
				serial: 4294967295,
				parent_serial: 67,
				type_id: 4,
				parent_type: 3,
				parent_id: null,
				window_id: 255,
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
				const DataListParser = require("../../lib/parsers/deviceListParser");
				const PacketModel = require("../../lib/models/packetModel");
				const PacketTemplate = require("../../lib/constants/packetTemplates");

				const parser = new DataListParser();
				const packetTemplate = new PacketTemplate();
				let template = packetTemplate.incomingCommTemplate[4];

				let packet = "aaaa0d040043ffffffffff8a44";
				let testObj = new PacketModel(template, packet, Date.now(), 0);
				let parsedPacketArr = await parser.parse(mockHappn, testObj);
				let result = await parser.buildNodeData(mockHappn, parsedPacketArr);

				await assert.deepEqual(result, expected);
			} catch (err) {
				return Promise.reject(err);
			}
		};

		return test();
	});
});
