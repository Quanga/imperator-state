/**
 * Created by grant on 2016/06/17.
 */

var assert = require("assert");

describe("parser-01-02-parser-test", async function() {
	const MockHappn = require("../mocks/mock_happn");
	var DataListParser = require("../../lib/parsers/deviceListParser");
	var DeviceDataParser = require("../../lib/parsers/deviceDataParser");

	const PacketTemplate = require("../../lib/constants/packetTemplates");
	const PacketModel = require("../../lib/models/packetModel");

	let mockHappn = new MockHappn();

	this.timeout(30000);

	before("it sets up the dependencies", async function() {});

	it("test for 01 ", async function() {
		var expected = [
			{
				serial: 1,
				parent_serial: null,
				type_id: 0,
				parent_type: null,
				parent_id: null,
				window_id: 0,
				communication_status: 1,
				key_switch_status: null,
				fire_button: null,
				cable_fault: null,
				isolation_relay: null,
				earth_leakage: null,
				blast_armed: null
			},
			{
				serial: 1,
				parent_serial: 1,
				type_id: 1,
				parent_type: 0,
				parent_id: null,
				window_id: null,
				communication_status: 1,
				key_switch_status: null,
				cable_fault: null,
				isolation_relay: null,
				earth_leakage: null,
				blast_armed: null
			},
			{
				serial: 2,
				parent_serial: 1,
				type_id: 1,
				parent_type: 0,
				parent_id: null,
				window_id: null,
				communication_status: 1,
				key_switch_status: null,
				cable_fault: null,
				isolation_relay: null,
				earth_leakage: null,
				blast_armed: null
			}
		];

		let test = async () => {
			try {
				const parser = new DataListParser();
				const packetTemplate = new PacketTemplate();

				let template = packetTemplate.incomingCommTemplate[1];

				let packet = "aaaa0c01000100010002bf5d";
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

	it("test for 02 ", async function() {
		var expected = [
			{
				serial: 1,
				parent_serial: null,
				type_id: 1,
				parent_type: 0,
				parent_id: null,
				window_id: 3,
				communication_status: 1,
				key_switch_status: null,
				cable_fault: null,
				isolation_relay: null,
				earth_leakage: null,
				blast_armed: null
			},
			{
				serial: 1,
				parent_serial: 1,
				type_id: 2,
				parent_type: 1,
				parent_id: null,
				window_id: 1,
				communication_status: 1,
				key_switch_status: null,
				detonator_status: null,
				booster_fired_lfs: null,
				partial_blast_lfs: null,
				missing_pulse_detected_lfs: null,
				DC_supply_voltage: null,
				mains: null
			},
			{
				serial: 2,
				parent_serial: 1,
				type_id: 2,
				parent_type: 1,
				parent_id: null,
				window_id: 2,
				communication_status: 1,
				key_switch_status: null,
				detonator_status: null,
				booster_fired_lfs: null,
				partial_blast_lfs: null,
				missing_pulse_detected_lfs: null,
				DC_supply_voltage: null,
				mains: null
			},
			{
				serial: 3,
				parent_serial: 1,
				type_id: 2,
				parent_type: 1,
				parent_id: null,
				window_id: 3,
				communication_status: 1,
				key_switch_status: null,
				detonator_status: null,
				booster_fired_lfs: null,
				partial_blast_lfs: null,
				missing_pulse_detected_lfs: null,
				DC_supply_voltage: null,
				mains: null
			}
		];

		let test = async () => {
			try {
				const parser = new DataListParser();
				const packetTemplate = new PacketTemplate();

				let template = packetTemplate.incomingCommTemplate[2];

				let packet = "aaaa0e0200010100020003000118";
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

	it("test for 03 ", async function() {
		var expected = [
			{
				serial: 1,
				parent_serial: null,
				type_id: 1,
				parent_type: 0,
				parent_id: null,
				window_id: null,
				communication_status: 1,
				key_switch_status: 0,
				isolation_relay: 0,
				earth_leakage: 0,
				blast_armed: 1,
				cable_fault: 0
			},
			{
				serial: null,
				parent_serial: 1,
				type_id: 2,
				parent_type: 1,
				parent_id: null,
				window_id: 1,
				communication_status: 1,
				key_switch_status: 1,
				detonator_status: 0,
				booster_fired_lfs: 0,
				partial_blast_lfs: 0,
				missing_pulse_detected_lfs: 0,
				DC_supply_voltage: 0,
				mains: 0
			},
			{
				serial: null,
				parent_serial: 1,
				type_id: 2,
				parent_type: 1,
				parent_id: null,
				window_id: 2,
				communication_status: 1,
				key_switch_status: 1,
				detonator_status: 0,
				booster_fired_lfs: 0,
				partial_blast_lfs: 0,
				missing_pulse_detected_lfs: 1,
				DC_supply_voltage: 0,
				mains: 0
			},
			{
				serial: null,
				parent_serial: 1,
				type_id: 2,
				parent_type: 1,
				parent_id: null,
				window_id: 3,
				communication_status: 1,
				key_switch_status: 1,
				detonator_status: 0,
				booster_fired_lfs: 0,
				partial_blast_lfs: 0,
				missing_pulse_detected_lfs: 1,
				DC_supply_voltage: 0,
				mains: 0
			}
		];

		let test = async () => {
			try {
				const parser = new DeviceDataParser();
				const packetTemplate = new PacketTemplate();

				let template = packetTemplate.incomingCommTemplate[3];
				//aaaa 10 03 0001 2130 - 4020 4240 4350  -63ff;
				let packet = "aaaa10030001213040204240435063ff";
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
});
