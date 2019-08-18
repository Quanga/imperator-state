var assert = require("assert");

describe("parser-01-02-parser-test", async function() {
	const MockHappn = require("../../mocks/mock_happn");
	var DataListParser = require("../../../lib/parsers/deviceListParser");
	var DeviceDataParser = require("../../../lib/parsers/deviceDataParser");

	const PacketTemplate = require("../../../lib/constants/packetTemplates");
	const PacketModel = require("../../../lib/models/packetModel");

	let mockHappn = new MockHappn();

	this.timeout(30000);

	before("it sets up the dependencies", async function() {});

	it("test for 01 ", async function() {
		var expected = [
			{
				serial: 1,
				parent_serial: null,
				typeId: 0,
				parent_type: null,
				windowId: null,
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
				typeId: 1,
				parent_type: 0,
				windowId: null,
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
				typeId: 1,
				parent_type: 0,
				windowId: null,
				communication_status: 1,
				key_switch_status: null,
				cable_fault: null,
				isolation_relay: null,
				earth_leakage: null,
				blast_armed: null
			}
		];

		const parser = new DataListParser();
		const packetTemplate = new PacketTemplate();

		var testObj = new PacketModel({
			packetTemplate: packetTemplate.incomingCommTemplate[1],
			packet: "aaaa0c01000100010002bf5d",
			created: Date.now(),
			pos: 0
		});

		let parsedPacketArr = await parser.parse(mockHappn, testObj);

		let result = await parser.buildNodeData(mockHappn, parsedPacketArr);

		let res = result.map(item => {
			return item.data;
		});

		res.forEach(item => {
			delete item.modified;
			delete item.created;
		});

		await assert.deepEqual(res, expected);
	});

	it("test for 02 ", async function() {
		var expected = [
			{
				serial: 1,
				parent_serial: null,
				typeId: 1,
				parent_type: 0,
				windowId: 3,
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
				typeId: 2,
				parent_type: 1,
				windowId: 1,
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
				typeId: 2,
				parent_type: 1,
				windowId: 2,
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
				typeId: 2,
				parent_type: 1,
				windowId: 3,
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

		const parser = new DataListParser();
		const packetTemplate = new PacketTemplate();

		var testObj = new PacketModel({
			packetTemplate: packetTemplate.incomingCommTemplate[2],
			packet: "aaaa0e0200010100020003000118",
			created: Date.now(),
			pos: 0
		});

		let parsedPacketArr = await parser.parse(mockHappn, testObj);

		let result = await parser.buildNodeData(mockHappn, parsedPacketArr);

		let res = result.map(item => {
			return item.data;
		});

		res.forEach(item => {
			delete item.modified;
			delete item.created;
		});

		await assert.deepEqual(res, expected);
	});

	it("test for 03 ", async function() {
		var expected = [
			{
				serial: 1,
				parent_serial: null,
				typeId: 1,
				parent_type: 0,
				windowId: null,
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
				typeId: 2,
				parent_type: 1,
				windowId: 1,
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
				typeId: 2,
				parent_type: 1,
				windowId: 2,
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
				typeId: 2,
				parent_type: 1,
				windowId: 3,
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

		const parser = new DeviceDataParser();
		const packetTemplate = new PacketTemplate();

		//aaaa 10 03 0001 2130 - 4020 4240 4350  -63ff;
		var testObj = new PacketModel({
			packetTemplate: packetTemplate.incomingCommTemplate[3],
			packet: "aaaa10030001213040204240435063ff",
			created: Date.now(),
			pos: 0
		});

		let parsedPacketArr = await parser.parse(mockHappn, testObj);

		let result = await parser.buildNodeData(mockHappn, parsedPacketArr);

		let res = result.map(item => {
			return item.data;
		});

		res.forEach(item => {
			delete item.modified;
			delete item.created;
		});

		await assert.deepEqual(res, expected);
	});
});
