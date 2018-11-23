// eslint-disable-next-line no-unused-vars
const expect = require("expect.js");
var assert = require("assert");

describe("001 PacketConstructor tests", async () => {
	const PacketConstructor = require("../../../lib/builders/packetConstructor");
	const MockHappn = require("../../mocks/mock_happn");
	var DataListParser = require("../../../lib/parsers/deviceListParser");
	var DeviceDataParser = require("../../../lib/parsers/deviceDataParser");

	const PacketTemplate = require("../../../lib/constants/packetTemplates");
	const PacketModel = require("../../../lib/models/packetModel");

	let mockHappn = new MockHappn();

	it("can construct a data packet with command 08", async () => {
		let test = async () => {
			try {
				var expected = [
					{
						blast_armed: 0,
						cable_fault: 0,
						communication_status: 1,
						earth_leakage: 0,
						fire_button: 0,
						isolation_relay: 0,
						key_switch_status: 0,
						parent_id: null,
						parent_serial: null,
						parent_type: null,
						serial: 12,
						type_id: 0,
						window_id: null
					}
				];
				const data = {
					data: [0, 0, 0, 0, 0, 0, 0, 0]
				};
				const packetConstructor = new PacketConstructor(8, 12, data);

				const parser = new DeviceDataParser();
				const packetTemplate = new PacketTemplate();

				let template = packetTemplate.incomingCommTemplate[8];

				let packet = packetConstructor.packet;
				var testObj = new PacketModel(template, packet, Date.now(), 0);

				let parsedPacketArr = await parser.parse(mockHappn, testObj);

				let result = await parser.buildNodeData(mockHappn, parsedPacketArr);

				let res = result.map(item => {
					return item.data;
				});

				res.forEach(item => {
					delete item.modified;
					delete item.created;
					delete item.id;
				});

				await assert.deepEqual(res, expected);
			} catch (err) {
				return Promise.reject(err);
			}
		};

		return test();
	});

	it("can construct a list packet with command 01", async () => {
		let test = async () => {
			try {
				var expected = [
					{
						serial: 12,
						parent_serial: null,
						type_id: 0,
						parent_type: null,
						parent_id: null,
						window_id: null,
						communication_status: 1,
						key_switch_status: null,
						fire_button: null,
						cable_fault: null,
						isolation_relay: null,
						earth_leakage: null,
						blast_armed: null
					},
					{
						serial: 22,
						parent_serial: 12,
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
						serial: 16,
						parent_serial: 12,
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
						serial: 56,
						parent_serial: 12,
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

				const data = {
					data: [22, 16, 56]
				};

				const packetConstructor = new PacketConstructor(1, 12, data);

				const parser = new DataListParser();
				const packetTemplate = new PacketTemplate();

				let template = packetTemplate.incomingCommTemplate[1];

				let packet = packetConstructor.packet;
				var testObj = new PacketModel(template, packet, Date.now(), 0);

				let parsedPacketArr = await parser.parse(mockHappn, testObj);

				let result = await parser.buildNodeData(mockHappn, parsedPacketArr);

				let res = result.map(item => {
					return item.data;
				});

				res.forEach(item => {
					delete item.modified;
					delete item.created;
					delete item.id;
				});
				//console.log(res);

				await assert.deepEqual(res, expected);
			} catch (err) {
				return Promise.reject(err);
			}
		};

		return test();
	});

	it("can construct a list packet with command 02", async () => {
		let test = async () => {
			try {
				var expected = [
					{
						serial: 34,
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
						serial: 12,
						parent_serial: 34,
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
						serial: 56,
						parent_serial: 34,
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
						serial: 89,
						parent_serial: 34,
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

				const data = {
					data: [12, 56, 89]
				};
				const packetConstructor = new PacketConstructor(2, 34, data);

				const parser = new DataListParser();
				const packetTemplate = new PacketTemplate();

				let template = packetTemplate.incomingCommTemplate[2];

				let packet = packetConstructor.packet;
				var testObj = new PacketModel(template, packet, Date.now(), 0);

				let parsedPacketArr = await parser.parse(mockHappn, testObj);

				let result = await parser.buildNodeData(mockHappn, parsedPacketArr);

				let res = result.map(item => {
					return item.data;
				});

				res.forEach(item => {
					delete item.modified;
					delete item.created;
					delete item.id;
				});

				await assert.deepEqual(res, expected);
			} catch (err) {
				return Promise.reject(err);
			}
		};

		return test();
	});

	it("can construct a data packet with command 03", async () => {
		let test = async () => {
			try {
				var expected = [
					{
						serial: 34,
						parent_serial: null,
						type_id: 1,
						parent_type: 0,
						parent_id: null,
						window_id: null,
						communication_status: 1,
						key_switch_status: 1,
						cable_fault: 0,
						isolation_relay: 0,
						earth_leakage: 0,
						blast_armed: 0
					},
					{
						serial: null,
						parent_serial: 34,
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
						parent_serial: 34,
						type_id: 2,
						parent_type: 1,
						parent_id: null,
						window_id: 2,
						communication_status: 1,
						key_switch_status: 1,
						detonator_status: 0,
						booster_fired_lfs: 0,
						partial_blast_lfs: 0,
						missing_pulse_detected_lfs: 0,
						DC_supply_voltage: 0,
						mains: 0
					}
				];

				const data = {
					data: [
						[0, 0, 0, 0, 0, 0, 0, 1],
						[0, 0, 0, 0, 0, 0, 1, 0],
						[0, 0, 0, 0, 0, 0, 1, 0]
					]
				};
				const packetConstructor = new PacketConstructor(3, 34, data);
				const parser = new DeviceDataParser();
				const packetTemplate = new PacketTemplate();

				let template = packetTemplate.incomingCommTemplate[3];

				let packet = packetConstructor.packet;
				var testObj = new PacketModel(template, packet, Date.now(), 0);

				let parsedPacketArr = await parser.parse(mockHappn, testObj);

				let result = await parser.buildNodeData(mockHappn, parsedPacketArr);

				let res = result.map(item => {
					return item.data;
				});

				res.forEach(item => {
					delete item.modified;
					delete item.created;
					delete item.id;
				});

				await assert.deepEqual(res, expected);
			} catch (err) {
				return Promise.reject(err);
			}
		};

		return test();
	});

	it("can construct a data packet with command 04", async () => {
		const data = {
			data: [
				{ serial: 4423423, window_id: 33 },
				{ serial: 4523434, window_id: 34 }
			]
		};
		let test = async () => {
			try {
				var expected = [
					{
						serial: 34,
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
						earth_leakage: null,
						led_state: null
					},
					{
						serial: 4423423,
						parent_serial: 34,
						type_id: 4,
						parent_type: 3,
						parent_id: null,
						window_id: 33,
						detonator_status: null,
						bridge_wire: null,
						calibration: null,
						program: null,
						booster_fired_lfs: null,
						tagged: null,
						logged: null
					},
					{
						serial: 4523434,
						parent_serial: 34,
						type_id: 4,
						parent_type: 3,
						parent_id: null,
						window_id: 34,
						detonator_status: null,
						bridge_wire: null,
						calibration: null,
						program: null,
						booster_fired_lfs: null,
						tagged: null,
						logged: null
					}
				];

				const packetConstructor = new PacketConstructor(4, 34, data);
				console.log(packetConstructor);

				const parser = new DataListParser();
				const packetTemplate = new PacketTemplate();

				let template = packetTemplate.incomingCommTemplate[4];

				let packet = packetConstructor.packet;
				var testObj = new PacketModel(template, packet, Date.now(), 0);

				let parsedPacketArr = await parser.parse(mockHappn, testObj);

				let result = await parser.buildNodeData(mockHappn, parsedPacketArr);

				let res = result.map(item => {
					return item.data;
				});

				res.forEach(item => {
					delete item.modified;
					delete item.created;
					delete item.id;
				});
				//console.log(res);

				await assert.deepEqual(res, expected);
			} catch (err) {
				return Promise.reject(err);
			}
		};

		return test();
	});

	it("can construct a data packet with command 05", async () => {
		const data = {
			data: [
				{
					serial: 13,
					window_id: 33,
					ledState: 6,
					rawData: [0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1]
				},
				{
					window_id: 34,
					rawData: [1, 0, 0, 0, 0, 0, 0, 1],
					delay: 2000
				}
			]
		};
		let test = async () => {
			try {
				var expected = [
					{
						serial: 43,
						parent_serial: null,
						type_id: 3,
						parent_type: 0,
						parent_id: null,
						window_id: 33,
						communication_status: 1,
						blast_armed: 0,
						key_switch_status: 1,
						isolation_relay: 0,
						mains: 0,
						low_bat: 1,
						too_low_bat: 0,
						DC_supply_voltage_status: 0,
						shaft_fault: 0,
						cable_fault: 0,
						earth_leakage: 0,
						led_state: null
					},
					{
						serial: null,
						parent_serial: 43,
						type_id: 4,
						parent_type: 3,
						parent_id: null,
						window_id: 34,
						detonator_status: 0,
						bridge_wire: 0,
						calibration: 0,
						program: 0,
						booster_fired_lfs: 0,
						tagged: 0,
						logged: 1,
						delay: 2000
					}
				];

				const packetConstructor = new PacketConstructor(5, 43, data);
				console.log(packetConstructor);

				const parser = new DeviceDataParser();
				const packetTemplate = new PacketTemplate();

				let template = packetTemplate.incomingCommTemplate[5];

				let packet = packetConstructor.packet;
				var testObj = new PacketModel(template, packet, Date.now(), 0);

				let parsedPacketArr = await parser.parse(mockHappn, testObj);

				let result = await parser.buildNodeData(mockHappn, parsedPacketArr);

				let res = result.map(item => {
					return item.data;
				});

				res.forEach(item => {
					delete item.modified;
					delete item.created;
					delete item.id;
				});

				await assert.deepEqual(res, expected);
			} catch (err) {
				return Promise.reject(err);
			}
		};

		return test();
	});
});
