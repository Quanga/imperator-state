/**
 * Created by grant on 2016/06/17.
 */

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
				window_id: null,
				communication_status: 1,
				blast_armed: 0,
				key_switch_status: 0,
				isolation_relay: 0,
				mains: 0,
				low_bat: 0,
				too_low_bat: 0,
				DC_supply_voltage_status: 0,
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
				window_id: 100,
				communication_status: 1,
				bridge_wire: 1,
				calibration: 0,
				program: 0,
				booster_fired_lfs: 1,
				tagged: 0,
				detonator_status: 0,
				logged: 0,
				delay: 10506
			},
			{
				serial: null,
				parent_serial: 67,
				type_id: 4,
				parent_type: 3,
				parent_id: null,
				window_id: 31,
				communication_status: 1,
				bridge_wire: 1,
				calibration: 1,
				program: 1,
				booster_fired_lfs: 1,
				tagged: 0,
				detonator_status: 0,
				logged: 0,
				delay: 3000
			},
			{
				serial: null,
				parent_serial: 67,
				type_id: 4,
				parent_type: 3,
				parent_id: null,
				window_id: 32,
				communication_status: 1,
				bridge_wire: 0,
				calibration: 0,
				program: 0,
				booster_fired_lfs: 0,
				tagged: 0,
				detonator_status: 0,
				logged: 0,
				delay: 3100
			},
			{
				serial: null,
				parent_serial: 67,
				type_id: 4,
				parent_type: 3,
				parent_id: null,
				window_id: 33,
				communication_status: 1,
				bridge_wire: 0,
				calibration: 0,
				program: 0,
				booster_fired_lfs: 0,
				tagged: 1,
				detonator_status: 0,
				logged: 0,
				delay: 3200
			},
			{
				serial: null,
				parent_serial: 67,
				type_id: 4,
				parent_type: 3,
				parent_id: null,
				window_id: 34,
				communication_status: 1,
				bridge_wire: 0,
				calibration: 0,
				program: 0,
				booster_fired_lfs: 1,
				tagged: 0,
				detonator_status: 0,
				logged: 0,
				delay: 3300
			},
			{
				serial: null,
				parent_serial: 67,
				type_id: 4,
				parent_type: 3,
				parent_id: null,
				window_id: 35,
				communication_status: 1,
				bridge_wire: 0,
				calibration: 0,
				program: 0,
				booster_fired_lfs: 1,
				tagged: 1,
				detonator_status: 0,
				logged: 0,
				delay: 3400
			},
			{
				serial: null,
				parent_serial: 67,
				type_id: 4,
				parent_type: 3,
				parent_id: null,
				window_id: 36,
				communication_status: 1,
				bridge_wire: 0,
				calibration: 0,
				program: 1,
				booster_fired_lfs: 0,
				tagged: 0,
				detonator_status: 0,
				logged: 0,
				delay: 3500
			},
			{
				serial: null,
				parent_serial: 67,
				type_id: 4,
				parent_type: 3,
				parent_id: null,
				window_id: 37,
				communication_status: 1,
				bridge_wire: 0,
				calibration: 0,
				program: 1,
				booster_fired_lfs: 0,
				tagged: 1,
				detonator_status: 0,
				logged: 0,
				delay: 3600
			},
			{
				serial: null,
				parent_serial: 67,
				type_id: 4,
				parent_type: 3,
				parent_id: null,
				window_id: 38,
				communication_status: 1,
				bridge_wire: 0,
				calibration: 0,
				program: 1,
				booster_fired_lfs: 1,
				tagged: 0,
				detonator_status: 0,
				logged: 0,
				delay: 3700
			},
			{
				serial: null,
				parent_serial: 67,
				type_id: 4,
				parent_type: 3,
				parent_id: null,
				window_id: 39,
				communication_status: 1,
				bridge_wire: 0,
				calibration: 0,
				program: 1,
				booster_fired_lfs: 1,
				tagged: 1,
				detonator_status: 0,
				logged: 0,
				delay: 3800
			},
			{
				serial: null,
				parent_serial: 67,
				type_id: 4,
				parent_type: 3,
				parent_id: null,
				window_id: 40,
				communication_status: 1,
				bridge_wire: 0,
				calibration: 1,
				program: 0,
				booster_fired_lfs: 0,
				tagged: 0,
				detonator_status: 0,
				logged: 0,
				delay: 3900
			},
			{
				serial: null,
				parent_serial: 67,
				type_id: 4,
				parent_type: 3,
				parent_id: null,
				window_id: 41,
				communication_status: 1,
				bridge_wire: 0,
				calibration: 1,
				program: 0,
				booster_fired_lfs: 0,
				tagged: 1,
				detonator_status: 0,
				logged: 0,
				delay: 4000
			},
			{
				serial: null,
				parent_serial: 67,
				type_id: 4,
				parent_type: 3,
				parent_id: null,
				window_id: 42,
				communication_status: 1,
				bridge_wire: 0,
				calibration: 1,
				program: 0,
				booster_fired_lfs: 1,
				tagged: 0,
				detonator_status: 0,
				logged: 0,
				delay: 4100
			},
			{
				serial: null,
				parent_serial: 67,
				type_id: 4,
				parent_type: 3,
				parent_id: null,
				window_id: 43,
				communication_status: 1,
				bridge_wire: 0,
				calibration: 1,
				program: 0,
				booster_fired_lfs: 1,
				tagged: 1,
				detonator_status: 0,
				logged: 0,
				delay: 4200
			},
			{
				serial: null,
				parent_serial: 67,
				type_id: 4,
				parent_type: 3,
				parent_id: null,
				window_id: 44,
				communication_status: 1,
				bridge_wire: 0,
				calibration: 1,
				program: 1,
				booster_fired_lfs: 0,
				tagged: 0,
				detonator_status: 0,
				logged: 0,
				delay: 4300
			},
			{
				serial: null,
				parent_serial: 67,
				type_id: 4,
				parent_type: 3,
				parent_id: null,
				window_id: 45,
				communication_status: 1,
				bridge_wire: 0,
				calibration: 1,
				program: 1,
				booster_fired_lfs: 0,
				tagged: 1,
				detonator_status: 0,
				logged: 0,
				delay: 4400
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

				let packet =
					"aaaa4805004364000a291f01b80b20011c0c2101800c2201e40c2301480d2401ac0d2501100e2601740e2701d80e28013c0f2901a00f2a0104102b0168102c01cc102d0130114a5d";
				var testObj = new PacketModel(template, packet, 0);
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
				window_id: 2,
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
				let testObj = new PacketModel(template, packet, 0);
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
