// eslint-disable-next-line no-unused-vars
const expect = require("expect.js");
var assert = require("assert");

describe("001 PacketConstructor tests", async () => {
	const PacketConstructor = require("../../../lib/builders/packetConstructor");
	const MockHappn = require("../../mocks/mock_happn");
	var DataListParser = require("../../../lib/parsers/deviceListParser");
	var DeviceDataParser = require("../../../lib/parsers/deviceDataParser");

	const PacketTemplate = require("../../../lib/constants/packetTemplates");

	let mockHappn = new MockHappn();

	it("can construct a data packet with command 08", async () => {
		let test = async () => {
			try {
				var expected = [
					{
						item: "ControlUnitModel",
						data: {
							serial: 12,
							parentSerial: null,
							typeId: 0,
							parentType: null,
							created: null,
							modified: null,
							path: "",
							communicationStatus: 1,
							keySwitchStatus: 0,
							fireButton: 0,
							cableFault: 0,
							isolationRelay: 0,
							earthLeakage: 0,
							blastArmed: 0
						}
					}
				];

				const packetConstructor = new PacketConstructor(8, 12, {
					data: [0, 0, 0, 0, 0, 0, 0, 0]
				}).packet;

				const packetTemplate = new PacketTemplate();
				const parser = new DeviceDataParser(
					packetTemplate.incomingCommTemplate[8]
				);

				const testObj = {
					packetTemplate: packetTemplate.incomingCommTemplate[8],
					packet: packetConstructor,
					created: Date.now(),
					pos: 0
				};

				const parsedPacketArr = await parser.parse(mockHappn, testObj);
				const result = await parser.buildNodeData(mockHappn, parsedPacketArr);

				const res = result.map(item => {
					return { item: item.constructor.name, data: item.data };
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
						item: "ControlUnitModel",
						data: {
							serial: 12,
							parentSerial: null,
							typeId: 0,
							parentType: null,
							created: null,
							modified: null,
							path: "",
							communicationStatus: 1,
							keySwitchStatus: null,
							fireButton: null,
							cableFault: null,
							isolationRelay: null,
							earthLeakage: null,
							blastArmed: null
						}
					},
					{
						item: "SectionControlModel",
						data: {
							serial: 22,
							parentSerial: 12,
							typeId: 1,
							parentType: 0,
							created: null,
							modified: null,
							path: "",
							communicationStatus: 1,
							keySwitchStatus: null,
							cableFault: null,
							isolationRelay: null,
							earthLeakage: null,
							blastArmed: null
						}
					},
					{
						item: "SectionControlModel",
						data: {
							serial: 16,
							parentSerial: 12,
							typeId: 1,
							parentType: 0,
							created: null,
							modified: null,
							path: "",
							communicationStatus: 1,
							keySwitchStatus: null,
							cableFault: null,
							isolationRelay: null,
							earthLeakage: null,
							blastArmed: null
						}
					},
					{
						item: "SectionControlModel",
						data: {
							serial: 56,
							parentSerial: 12,
							typeId: 1,
							parentType: 0,
							created: null,
							modified: null,
							path: "",
							communicationStatus: 1,
							keySwitchStatus: null,
							cableFault: null,
							isolationRelay: null,
							earthLeakage: null,
							blastArmed: null
						}
					}
				];

				const packetConstructor = new PacketConstructor(1, 12, {
					data: [22, 16, 56]
				});

				const packetTemplate = new PacketTemplate();
				const parser = new DataListParser(
					packetTemplate.incomingCommTemplate[1]
				);

				const testObj = {
					packetTemplate: packetTemplate.incomingCommTemplate[1],
					packet: packetConstructor.packet,
					created: Date.now(),
					pos: 0
				};

				const parsedPacketArr = await parser.parse(mockHappn, testObj);
				const result = await parser.buildNodeData(mockHappn, parsedPacketArr);

				const res = result.map(item => {
					return { item: item.constructor.name, data: item.data };
				});

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
						item: "SectionControlModel",
						data: {
							serial: 34,
							parentSerial: null,
							typeId: 1,
							parentType: 0,
							created: null,
							modified: null,
							path: "",
							communicationStatus: 1,
							keySwitchStatus: null,
							cableFault: null,
							isolationRelay: null,
							earthLeakage: null,
							blastArmed: null
						}
					},
					{
						item: "BoosterModel",
						data: {
							serial: null,
							parentSerial: 34,
							typeId: 2,
							parentType: 1,
							created: null,
							modified: null,
							path: "",
							communicationStatus: 1,
							keySwitchStatus: null,
							detonatorStatus: null,
							boosterFired: null,
							partialBlast: null,
							missingPulseDetected: null,
							dcSupplyVoltage: null,
							mains: null
						}
					},
					{
						item: "BoosterModel",
						data: {
							serial: null,
							parentSerial: 34,
							typeId: 2,
							parentType: 1,
							created: null,
							modified: null,
							path: "",
							communicationStatus: 1,
							keySwitchStatus: null,
							detonatorStatus: null,
							boosterFired: null,
							partialBlast: null,
							missingPulseDetected: null,
							dcSupplyVoltage: null,
							mains: null
						}
					},
					{
						item: "BoosterModel",
						data: {
							serial: null,
							parentSerial: 34,
							typeId: 2,
							parentType: 1,
							created: null,
							modified: null,
							path: "",
							communicationStatus: 1,
							keySwitchStatus: null,
							detonatorStatus: null,
							boosterFired: null,
							partialBlast: null,
							missingPulseDetected: null,
							dcSupplyVoltage: null,
							mains: null
						}
					}
				];

				const packetConstructor = new PacketConstructor(2, 34, {
					data: [12, 56, 89]
				});

				const packetTemplate = new PacketTemplate();
				const parser = new DataListParser(
					packetTemplate.incomingCommTemplate[2]
				);

				const testObj = {
					packetTemplate: packetTemplate.incomingCommTemplate[2],
					packet: packetConstructor.packet,
					created: Date.now(),
					pos: 0
				};

				const parsedPacketArr = await parser.parse(mockHappn, testObj);
				const result = await parser.buildNodeData(mockHappn, parsedPacketArr);
				const res = result.map(item => {
					return { item: item.constructor.name, data: item.data };
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
						item: "SectionControlModel",
						data: {
							serial: 34,
							parentSerial: null,
							typeId: 1,
							parentType: 0,
							created: null,
							modified: null,
							path: "",
							communicationStatus: 1,
							keySwitchStatus: 1,
							cableFault: 0,
							isolationRelay: 0,
							earthLeakage: 0,
							blastArmed: 0
						}
					},
					{
						item: "BoosterModel",
						data: {
							serial: null,
							parentSerial: 34,
							typeId: 2,
							parentType: 1,
							created: null,
							modified: null,
							path: "",
							communicationStatus: 1,
							keySwitchStatus: 1,
							detonatorStatus: 0,
							boosterFired: 0,
							partialBlast: 0,
							missingPulseDetected: 0,
							dcSupplyVoltage: 0,
							mains: 0
						}
					},
					{
						item: "BoosterModel",
						data: {
							serial: null,
							parentSerial: 34,
							typeId: 2,
							parentType: 1,
							created: null,
							modified: null,
							path: "",
							communicationStatus: 1,
							keySwitchStatus: 1,
							detonatorStatus: 0,
							boosterFired: 0,
							partialBlast: 0,
							missingPulseDetected: 0,
							dcSupplyVoltage: 0,
							mains: 0
						}
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
				const packetTemplate = new PacketTemplate();
				const parser = new DeviceDataParser(
					packetTemplate.incomingCommTemplate[3]
				);

				var testObj = {
					packetTemplate: packetTemplate.incomingCommTemplate[3],
					packet: packetConstructor.packet,
					created: Date.now(),
					pos: 0
				};

				const parsedPacketArr = await parser.parse(mockHappn, testObj);
				const result = await parser.buildNodeData(mockHappn, parsedPacketArr);

				const res = result.map(item => {
					return { item: item.constructor.name, data: item.data };
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
				{ serial: 4423423, windowId: 33 },
				{ serial: 4523434, windowId: 34 }
			]
		};
		let test = async () => {
			try {
				const expected = [
					{
						item: "CBoosterModel",
						data: {
							serial: 34,
							parentSerial: null,
							typeId: 3,
							parentType: 0,
							created: null,
							modified: null,
							path: "",
							communicationStatus: 1,
							blastArmed: null,
							keySwitchStatus: null,
							isolationRelay: null,
							mains: null,
							lowBat: null,
							tooLowBat: null,
							dcSupplyVoltage: null,
							shaftFault: null,
							cableFault: null,
							earthLeakage: null,
							ledState: null,
							childCount: 2
						}
					},
					{
						item: "EDDModel",
						data: {
							serial: 4423423,
							parentSerial: 34,
							typeId: 4,
							parentType: 3,
							created: null,
							modified: null,
							path: "",
							detonatorStatus: null,
							bridgeWire: null,
							calibration: null,
							program: null,
							boosterFired: null,
							tagged: null,
							logged: null,
							delay: null,
							windowId: 33
						}
					},
					{
						item: "EDDModel",
						data: {
							serial: 4523434,
							parentSerial: 34,
							typeId: 4,
							parentType: 3,
							created: null,
							modified: null,
							path: "",
							detonatorStatus: null,
							bridgeWire: null,
							calibration: null,
							program: null,
							boosterFired: null,
							tagged: null,
							logged: null,
							delay: null,
							windowId: 34
						}
					}
				];

				const packetConstructor = new PacketConstructor(4, 34, data);

				const packetTemplate = new PacketTemplate();
				const parser = new DataListParser(
					packetTemplate.incomingCommTemplate[4]
				);

				const testObj = {
					packetTemplate: packetTemplate.incomingCommTemplate[4],
					packet: packetConstructor.packet,
					created: Date.now(),
					pos: 0
				};

				let parsedPacketArr = await parser.parse(mockHappn, testObj);

				let result = await parser.buildNodeData(mockHappn, parsedPacketArr);

				const res = result.map(item => {
					return { item: item.constructor.name, data: item.data };
				});

				await assert.deepEqual(res, expected);
			} catch (err) {
				return Promise.reject(err);
			}
		};

		return test();
	});

	it("can construct a data packet with command 05", async () => {
		let test = async () => {
			try {
				let expected = [
					{
						item: "CBoosterModel",
						data: {
							serial: 43,
							parentSerial: null,
							typeId: 3,
							parentType: 0,
							created: null,
							modified: null,
							path: "",
							communicationStatus: 1,
							blastArmed: 0,
							keySwitchStatus: 1,
							isolationRelay: 0,
							mains: 0,
							lowBat: 1,
							tooLowBat: 0,
							dcSupplyVoltage: 0,
							shaftFault: 0,
							cableFault: 0,
							earthLeakage: 0,
							ledState: 6,
							childCount: 33
						}
					},
					{
						item: "EDDModel",
						data: {
							serial: null,
							parentSerial: 43,
							typeId: 4,
							parentType: 3,
							created: null,
							modified: null,
							path: "",
							detonatorStatus: 0,
							bridgeWire: 0,
							calibration: 0,
							program: 0,
							boosterFired: 0,
							tagged: 0,
							logged: 1,
							delay: 2000,
							windowId: 34
						}
					}
				];

				const data = {
					data: [
						{
							serial: 13,
							windowId: 33,
							ledState: 6,
							rawData: [0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1]
						},
						{
							windowId: 34,
							rawData: [1, 0, 0, 0, 0, 0, 0, 1],
							delay: 2000
						}
					]
				};
				const packetConstructor = new PacketConstructor(5, 43, data);
				const packetTemplate = new PacketTemplate();

				const parser = new DeviceDataParser(
					packetTemplate.incomingCommTemplate[5]
				);

				var testObj = {
					packetTemplate: packetTemplate.incomingCommTemplate[5],
					packet: packetConstructor.packet,
					created: Date.now(),
					pos: 0
				};

				const parsedPacketArr = await parser.parse(mockHappn, testObj);

				const result = await parser.buildNodeData(mockHappn, parsedPacketArr);

				const res = result.map(item => {
					return { item: item.constructor.name, data: item.data };
				});

				await assert.deepEqual(res, expected);
			} catch (err) {
				return Promise.reject(err);
			}
		};

		return test();
	});

	it("can construct a data packet with command 05 with only CBB data", async () => {
		const data = {
			data: [
				{
					serial: 13,
					windowId: 33,
					ledState: 6,
					rawData: [0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1]
				}
			]
		};
		let test = async () => {
			try {
				var expected = [
					{
						item: "CBoosterModel",
						data: {
							serial: 43,
							parentSerial: null,
							typeId: 3,
							parentType: 0,
							created: null,
							modified: null,
							path: "",
							communicationStatus: 1,
							blastArmed: 0,
							keySwitchStatus: 1,
							isolationRelay: 0,
							mains: 0,
							lowBat: 1,
							tooLowBat: 0,
							dcSupplyVoltage: 0,
							shaftFault: 0,
							cableFault: 0,
							earthLeakage: 0,
							ledState: 6,
							childCount: 33
						}
					}
				];

				const packetConstructor = new PacketConstructor(5, 43, data);
				const packetTemplate = new PacketTemplate();

				const parser = new DeviceDataParser(
					packetTemplate.incomingCommTemplate[5]
				);

				var testObj = {
					packetTemplate: packetTemplate.incomingCommTemplate[5],
					packet: packetConstructor.packet,
					created: Date.now(),
					pos: 0
				};

				let parsedPacketArr = await parser.parse(mockHappn, testObj);

				let result = await parser.buildNodeData(mockHappn, parsedPacketArr);

				const res = result.map(item => {
					return { item: item.constructor.name, data: item.data };
				});
				console.log(res);

				await assert.deepEqual(res, expected);
			} catch (err) {
				return Promise.reject(err);
			}
		};

		return test();
	});
});
