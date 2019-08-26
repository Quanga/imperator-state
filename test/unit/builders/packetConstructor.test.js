// eslint-disable-next-line no-unused-vars
const chai = require("chai");
const expect = chai.expect;
chai.use(require("chai-match"));
//const sinon = require("sinon");
const sinonChai = require("sinon-chai");
chai.use(sinonChai);

const PacketConstructor = require("../../../lib/builders/packetConstructor");
const DataListParser = require("../../../lib/parsers/deviceListParser");
const DeviceDataParser = require("../../../lib/parsers/deviceDataParser");

const PacketTemplate = require("../../../lib/constants/packetTemplates");

describe("UNIT - Utils", async () => {
	context("001 PacketConstructor tests", async () => {
		it("will fail with the wrong constructor", async () => {
			//constructor(command, parentSerial, data = { data: [] })
			expect(() => new PacketConstructor()).to.throw(
				Error,
				"No arguments supplied, cannot create PacketConstructor"
			);
		});

		it("will fail with the wrong command type", async () => {
			//constructor(command, parentSerial, data = { data: [] })
			let x = new PacketConstructor(8, 12, {
				data: [0, 0, 0, 0, 0, 0, 0, 0]
			}).packet;
			console.log(x);

			x = new PacketConstructor("8", 12, {
				data: [0, 0, 0, 0, 0, 0, 0, 0]
			}).packet;
			console.log(x);
			// expect(() => new PacketConstructor()).to.throw(
			// 	Error,
			// 	"No arguments supplied, cannot create PacketConstructor"
			// );
		});
		it("can construct a data packet with command 08", async () => {
			const createdAt = Date.now();

			const expected = {
				item: "ControlUnitModel",
				data: {
					serial: 12,
					typeId: 0,
					parentType: null,
					createdAt: createdAt,
					modifiedAt: null,
					path: "",
					communicationStatus: 1,
					keySwitchStatus: 0,
					fireButton: 0,
					cableFault: 0,
					isolationRelay: 0,
					earthLeakage: 0,
					blastArmed: 0
				}
			};

			const packetConstructor = new PacketConstructor(8, 12, {
				data: [0, 0, 0, 0, 0, 0, 0, 0]
			}).packet;

			const incomingTemplate = new PacketTemplate().incomingCommTemplate[8];
			const parser = new DeviceDataParser(incomingTemplate);

			const testObj = {
				packetTemplate: incomingTemplate,
				packet: packetConstructor,
				createdAt,
				pos: 0
			};
			const parsedPacketArr = await parser.parse(testObj);
			const result = await parser.buildNodeData(parsedPacketArr);

			const res = result.map(item => {
				return { item: item.constructor.name, data: item.data };
			});

			await expect(res[0]).to.be.deep.equal(expected);
		});

		xit("can construct a list packet with command 01", async () => {
			var expected = [
				{
					item: "ControlUnitModel",
					data: {
						serial: 12,
						parentSerial: null,
						typeId: 0,
						parentType: null,
						createdAt: null,
						modifiedAt: null,
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
						createdAt: null,
						modifiedAt: null,
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
						createdAt: null,
						modifiedAt: null,
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
						createdAt: null,
						modifiedAt: null,
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
			const parser = new DataListParser(packetTemplate.incomingCommTemplate[1]);

			const testObj = {
				packetTemplate: packetTemplate.incomingCommTemplate[1],
				packet: packetConstructor.packet,
				createdAt: Date.now(),
				pos: 0
			};

			const parsedPacketArr = await parser.parse(testObj);
			const result = await parser.buildNodeData(parsedPacketArr);

			const res = result.map(item => {
				return { item: item.constructor.name, data: item.data };
			});

			await expect(res).to.deep.equal(expected);
		});

		it("can construct a list packet with command 02", async () => {
			const createdAt = Date.now();
			var expected = [
				{
					item: "SectionControlModel",
					data: {
						serial: 34,
						typeId: 1,
						parentType: 0,
						createdAt,
						modifiedAt: null,
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
						typeId: 2,
						parentType: 1,
						createdAt,
						modifiedAt: null,
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
						typeId: 2,
						parentType: 1,
						createdAt,
						modifiedAt: null,
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
						typeId: 2,
						parentType: 1,
						createdAt,
						modifiedAt: null,
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
			const incomingTemplate = packetTemplate.incomingCommTemplate[2];
			const parser = new DataListParser(incomingTemplate);

			const testObj = {
				packetTemplate: packetTemplate.incomingCommTemplate[2],
				packet: packetConstructor.packet,
				createdAt,
				pos: 0
			};

			const parsedPacketArr = await parser.parse(testObj);
			const result = await parser.buildNodeData(parsedPacketArr);
			const res = result.map(item => {
				return { item: item.constructor.name, data: item.data };
			});

			await expect(res).to.deep.equal(expected);
		});

		it("can construct a data packet with command 03", async () => {
			const createdAt = Date.now();
			const expected = [
				{
					item: "SectionControlModel",
					data: {
						serial: 34,
						typeId: 1,
						parentType: 0,
						createdAt,
						modifiedAt: null,
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
						typeId: 2,
						parentType: 1,
						createdAt,
						modifiedAt: null,
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
						typeId: 2,
						parentType: 1,
						createdAt,
						modifiedAt: null,
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
				data: [[0, 0, 0, 0, 0, 0, 0, 1], [0, 0, 0, 0, 0, 0, 1, 0], [0, 0, 0, 0, 0, 0, 1, 0]]
			};
			const packetConstructor = new PacketConstructor(3, 34, data);
			const packetTemplate = new PacketTemplate();
			const incomingTemplate = packetTemplate.incomingCommTemplate[3];
			const parser = new DeviceDataParser(incomingTemplate);

			var testObj = {
				packetTemplate: incomingTemplate,
				packet: packetConstructor.packet,
				createdAt,
				pos: 0
			};

			const parsedPacketArr = await parser.parse(testObj);
			const result = await parser.buildNodeData(parsedPacketArr);

			const res = result.map(item => {
				return { item: item.constructor.name, data: item.data };
			});

			await expect(res).to.deep.equal(expected);
		});

		it("can construct a data packet with command 04", async () => {
			const data = {
				data: [{ serial: 4423423, windowId: 33 }, { serial: 4523434, windowId: 34 }]
			};

			const createdAt = Date.now();

			const expected = [
				{
					item: "CBoosterModel",
					data: {
						serial: 34,
						typeId: 3,
						parentType: 0,
						createdAt,
						modifiedAt: null,
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
						childCount: null
					}
				},
				{
					item: "EDDModel",
					data: {
						serial: 4423423,
						parentSerial: 34,
						typeId: 4,
						parentType: 3,
						createdAt,
						modifiedAt: null,
						path: "",
						detonatorStatus: 0,
						bridgeWire: 0,
						calibration: 0,
						program: 0,
						boosterFired: 0,
						tagged: 0,
						logged: 0,
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
						createdAt,
						modifiedAt: null,
						path: "",
						detonatorStatus: 0,
						bridgeWire: 0,
						calibration: 0,
						program: 0,
						boosterFired: 0,
						tagged: 0,
						logged: 0,
						delay: null,
						windowId: 34
					}
				}
			];

			const packetConstructor = new PacketConstructor(4, 34, data);

			const packetTemplate = new PacketTemplate();
			const parser = new DataListParser(packetTemplate.incomingCommTemplate[4]);

			const testObj = {
				packetTemplate: packetTemplate.incomingCommTemplate[4],
				packet: packetConstructor.packet,
				createdAt,
				pos: 0
			};

			let parsedPacketArr = await parser.parse(testObj);

			let result = await parser.buildNodeData(parsedPacketArr);

			const res = result.map(item => {
				return { item: item.constructor.name, data: item.data };
			});

			await expect(res).to.deep.equal(expected);
		});

		it("can construct a data packet with command 05", async () => {
			const createdAt = Date.now();
			let expected = [
				{
					item: "CBoosterModel",
					data: {
						serial: 43,
						typeId: 3,
						parentType: 0,
						createdAt,
						modifiedAt: null,
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
						createdAt,
						modifiedAt: null,
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
						childCount: 33,
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

			const parser = new DeviceDataParser(packetTemplate.incomingCommTemplate[5]);

			var testObj = {
				packetTemplate: packetTemplate.incomingCommTemplate[5],
				packet: packetConstructor.packet,
				createdAt,
				pos: 0
			};

			const parsedPacketArr = await parser.parse(testObj);

			const result = await parser.buildNodeData(parsedPacketArr);

			const res = result.map(item => {
				return { item: item.constructor.name, data: item.data };
			});

			await expect(res).to.deep.equal(expected);
		});

		it("can construct a data packet with command 05 with only CBB data", async () => {
			const data = {
				data: [
					{
						serial: 13,
						childCount: 33,
						ledState: 6,
						rawData: [0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1]
					}
				]
			};

			const createdAt = Date.now();
			var expected = [
				{
					item: "CBoosterModel",
					data: {
						serial: 43,
						typeId: 3,
						parentType: 0,
						createdAt,
						modifiedAt: null,
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

			const parser = new DeviceDataParser(packetTemplate.incomingCommTemplate[5]);

			const testObj = {
				packetTemplate: packetTemplate.incomingCommTemplate[5],
				packet: packetConstructor.packet,
				createdAt,
				pos: 0
			};

			const parsedPacketArr = await parser.parse(testObj);
			const result = await parser.buildNodeData(parsedPacketArr);

			const res = result.map(item => {
				return { item: item.constructor.name, data: item.data };
			});

			await expect(res).to.deep.equal(expected);
		});

		it("can calculate the correct packet length", async () => {
			const data = {
				data: [
					{
						serial: 13,
						childCount: 33,
						ledState: 6,
						rawData: [0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1]
					}
				]
			};
			const packetConstructor = new PacketConstructor(5, 43, data);
			console.log(packetConstructor.packet);

			/*
			 AAAA 0A 03 0001 4040 07BE
			 */
			var expected = "10";
			//const expectedHex = 0x0a;
			const dataRaw = data.data[0].rawData;
			const res = packetConstructor.calculatePacketLength(dataRaw); // incoming CRC stripped off end
			expect(res).to.be.equal(expected);
			console.log(parseInt("10", 16));
		});

		it("can construct an outgoing packet with 01 command", async function() {
			const CMD_PI_CLOSE_RELAY = 0b00010001;
			//const CMD_PI_CLOSE_RELAY_ARR = [0, 0, 0, 1, 0, 0, 0, 1];
			const CMD_PI_OPEN_RELAY = 0b00010010;
			//const CMD_PI_OPEN_RELAY_ARR = [0, 0, 0, 1, 0, 0, 1, 0];
			const packetConstructor = new PacketConstructor(CMD_PI_CLOSE_RELAY, 158);
			const packetConstructor2 = new PacketConstructor(CMD_PI_OPEN_RELAY, 158);
			console.log(packetConstructor);
			console.log(packetConstructor2);
		});
	});
});
