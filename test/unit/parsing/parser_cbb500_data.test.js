const chai = require("chai");
const expect = chai.expect;
chai.use(require("chai-match"));

const PacketValidation = require("../../../lib/parsers/packetValidataion");

describe("UNIT - Parser", async function() {
	this.timeout(10000);

	context("CBB500 DATA", async () => {
		const validator = new PacketValidation();
		let createdAt = Date.now();
		process.env.MODE = "HYDRA";
		it("can create a result array with nodes containing CBB & EDD data from a parsed packet", async function() {
			const expected = [
				{
					itemType: "CBoosterModel",
					itemData: {
						serial: 65535,
						typeId: 3,
						parentType: 0,
						createdAt,
						modifiedAt: null,
						path: "",
						communicationStatus: 1,
						blastArmed: null,
						keySwitchStatus: null,
						isolationRelay: null,
						lfs: null,
						mains: null,
						lowBat: null,
						tooLowBat: null,
						dcSupplyVoltage: null,
						shaftFault: null,
						cableFault: null,
						earthLeakage: null,
						ledState: null,
						childCount: 0,
						lostPackets: null,
						packetSinceLastFiring: null
					}
				},
				{
					itemType: "EDDModel",
					itemData: {
						serial: null,
						parentSerial: 65535,
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
						delay: 9200,
						windowId: 493
					}
				},
				{
					itemType: "EDDModel",
					itemData: {
						serial: null,
						parentSerial: 65535,
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
						delay: 9300,
						windowId: 494
					}
				},
				{
					itemType: "EDDModel",
					itemData: {
						serial: null,
						parentSerial: 65535,
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
						delay: 9400,
						windowId: 495
					}
				},
				{
					itemType: "EDDModel",
					itemData: {
						serial: null,
						parentSerial: 65535,
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
						delay: 9500,
						windowId: 496
					}
				},
				{
					itemType: "EDDModel",
					itemData: {
						serial: null,
						parentSerial: 65535,
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
						delay: 9600,
						windowId: 497
					}
				},
				{
					itemType: "EDDModel",
					itemData: {
						serial: null,
						parentSerial: 65535,
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
						delay: 9700,
						windowId: 498
					}
				},
				{
					itemType: "EDDModel",
					itemData: {
						serial: null,
						parentSerial: 65535,
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
						delay: 9800,
						windowId: 499
					}
				},
				{
					itemType: "EDDModel",
					itemData: {
						serial: null,
						parentSerial: 65535,
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
						delay: 9900,
						windowId: 500
					}
				}
			];

			const DataListParser = require("../../../lib/parsers/deviceDataParser");
			const PacketTemplate = require("../../../lib/constants/packetTemplates");

			const packetTemplate = new PacketTemplate();

			const parser = new DataListParser(packetTemplate.incomingCommTemplate[23]);

			const testObj = {
				packet:
					"aaaa3017ffffed0101f023ee01015424ef0101b824f001011c25f101018025f20101e425f301014826f40101ac262665",
				createdAt
			};

			const valid = await validator.validatePacket(
				testObj,
				packetTemplate.incomingCommTemplate[23].chunk
			);

			let parsedPacketArr = await parser.parse(valid);

			let result = await parser.buildNodeData(parsedPacketArr);
			console.log(result);

			let res = result.map(item => {
				return {
					itemType: item.constructor.name,
					itemData: item.data
				};
			});

			await expect(res).to.deep.equal(expected);
		});

		it("can correctly handle an 05 on the cbb500 system", async function() {
			const createTime = Date.now();

			const expected = [
				{
					itemType: "CBoosterModel",
					itemData: {
						serial: 4,
						typeId: 3,
						parentType: 0,
						createdAt: createTime,
						modifiedAt: null,
						path: "",
						communicationStatus: 1,
						blastArmed: 1,
						keySwitchStatus: 1,
						isolationRelay: 0,
						mains: 1,
						lowBat: 0,
						lfs: 0,
						tooLowBat: 0,
						dcSupplyVoltage: 1,
						shaftFault: 0,
						cableFault: 0,
						earthLeakage: 0,
						ledState: 1,
						childCount: 500,
						lostPackets: null,
						packetSinceLastFiring: null
					}
				}
			];
			process.env.MODE = "HYDRA";
			const DataParser = require("../../../lib/parsers/deviceDataParser");
			const PacketTemplate = require("../../../lib/constants/packetTemplates");

			const packetTemplate = new PacketTemplate();

			const parser = new DataParser(packetTemplate.incomingCommTemplate[5]);

			const testObj = {
				packet: "aaaa0c050004f401192902cc",
				createdAt: createTime
			};

			const valid = await validator.validatePacket(
				testObj,
				packetTemplate.incomingCommTemplate[5].chunk
			);

			let parsedPacketArr = await parser.parse(valid);
			let result = await parser.buildNodeData(parsedPacketArr);

			let res = result.map(item => {
				return {
					itemType: item.constructor.name,
					itemData: item.data
				};
			});

			expect(res).to.deep.equal(expected);
		});

		it("can decrypt a 17 packet", async function() {
			const DataListParser = require("../../../lib/parsers/deviceDataParser");
			const PacketTemplate = require("../../../lib/constants/packetTemplates");

			const packetTemplate = new PacketTemplate();

			const parser = new DataListParser(packetTemplate.incomingCommTemplate[23]);

			const testObj = {
				packet:
					"aaaa44170004010073a411020073a10f030073b40d040073b90b0500738a09060073cf07070073db05080073e703090073f3010a007300000b007300000c0073f4013e4e",
				createdAt
			};

			const valid = await validator.validatePacket(
				testObj,
				packetTemplate.incomingCommTemplate[23].chunk
			);

			let parsedPacketArr = await parser.parse(valid);

			let result = await parser.buildNodeData(parsedPacketArr);
			console.log(result);

			let res = result.map(item => {
				return {
					itemType: item.constructor.name,
					itemData: item.data
				};
			});
			console.log(JSON.stringify(res, null, 2));
			//await expect(res).to.deep.equal(expected);
		});
	});
});
