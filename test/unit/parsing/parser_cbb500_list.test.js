/* eslint-disable max-len */
const chai = require("chai");
const expect = chai.expect;
chai.use(require("chai-match"));
// const sinon = require("sinon");
// const sinonChai = require("sinon-chai");
// const chaiPromise = require("chai-as-promised");
const PacketValidation = require("../../../lib/parsers/packetValidataion");

describe("UNIT - Parser", async function() {
	this.timeout(2000);
	var DataListParser = require("../../../lib/parsers/deviceListParser");
	const PacketTemplate = require("../../../lib/constants/packetTemplates");

	context("CBB500 LIST", async () => {
		const validator = new PacketValidation();

		it("can create a result array with nodes containing CBB and EDD data from a parsed packet", async function() {
			const createdAt = Date.now();
			var expected = [
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
						mains: null,
						lfs: null,
						lowBat: null,
						tooLowBat: null,
						dcSupplyVoltage: null,
						shaftFault: null,
						cableFault: null,
						earthLeakage: null,
						ledState: null,
						childCount: null,
						lostPackets: null,
						packetSinceLastFiring: null
					}
				},
				{
					itemType: "EDDModel",
					itemData: {
						serial: 457838606,
						parentSerial: 65535,
						typeId: 4,
						parentType: 3,
						createdAt,
						modifiedAt: null,
						path: "",
						detonatorStatus: null,
						bridgeWire: null,
						calibration: null,
						program: null,
						boosterFired: null,
						tagged: null,
						logged: null,
						delay: null,
						windowId: 381
					}
				},
				{
					itemType: "EDDModel",
					itemData: {
						serial: 457838605,
						parentSerial: 65535,
						typeId: 4,
						parentType: 3,
						createdAt,
						modifiedAt: null,
						path: "",
						detonatorStatus: null,
						bridgeWire: null,
						calibration: null,
						program: null,
						boosterFired: null,
						tagged: null,
						logged: null,
						delay: null,
						windowId: 382
					}
				},
				{
					itemType: "EDDModel",
					itemData: {
						serial: 457838604,
						parentSerial: 65535,
						typeId: 4,
						parentType: 3,
						createdAt,
						modifiedAt: null,
						path: "",
						detonatorStatus: null,
						bridgeWire: null,
						calibration: null,
						program: null,
						boosterFired: null,
						tagged: null,
						logged: null,
						delay: null,
						windowId: 383
					}
				},
				{
					itemType: "EDDModel",
					itemData: {
						serial: 457838603,
						parentSerial: 65535,
						typeId: 4,
						parentType: 3,
						createdAt,
						modifiedAt: null,
						path: "",
						detonatorStatus: null,
						bridgeWire: null,
						calibration: null,
						program: null,
						boosterFired: null,
						tagged: null,
						logged: null,
						delay: null,
						windowId: 384
					}
				},
				{
					itemType: "EDDModel",
					itemData: {
						serial: 457838602,
						parentSerial: 65535,
						typeId: 4,
						parentType: 3,
						createdAt,
						modifiedAt: null,
						path: "",
						detonatorStatus: null,
						bridgeWire: null,
						calibration: null,
						program: null,
						boosterFired: null,
						tagged: null,
						logged: null,
						delay: null,
						windowId: 385
					}
				},
				{
					itemType: "EDDModel",
					itemData: {
						serial: 457838601,
						parentSerial: 65535,
						typeId: 4,
						parentType: 3,
						createdAt,
						modifiedAt: null,
						path: "",
						detonatorStatus: null,
						bridgeWire: null,
						calibration: null,
						program: null,
						boosterFired: null,
						tagged: null,
						logged: null,
						delay: null,
						windowId: 386
					}
				},
				{
					itemType: "EDDModel",
					itemData: {
						serial: 457838600,
						parentSerial: 65535,
						typeId: 4,
						parentType: 3,
						createdAt,
						modifiedAt: null,
						path: "",
						detonatorStatus: null,
						bridgeWire: null,
						calibration: null,
						program: null,
						boosterFired: null,
						tagged: null,
						logged: null,
						delay: null,
						windowId: 387
					}
				},
				{
					itemType: "EDDModel",
					itemData: {
						serial: 457838599,
						parentSerial: 65535,
						typeId: 4,
						parentType: 3,
						createdAt,
						modifiedAt: null,
						path: "",
						detonatorStatus: null,
						bridgeWire: null,
						calibration: null,
						program: null,
						boosterFired: null,
						tagged: null,
						logged: null,
						delay: null,
						windowId: 388
					}
				},
				{
					itemType: "EDDModel",
					itemData: {
						serial: 457838598,
						parentSerial: 65535,
						typeId: 4,
						parentType: 3,
						createdAt,
						modifiedAt: null,
						path: "",
						detonatorStatus: null,
						bridgeWire: null,
						calibration: null,
						program: null,
						boosterFired: null,
						tagged: null,
						logged: null,
						delay: null,
						windowId: 389
					}
				},
				{
					itemType: "EDDModel",
					itemData: {
						serial: 457865855,
						parentSerial: 65535,
						typeId: 4,
						parentType: 3,
						createdAt,
						modifiedAt: null,
						path: "",
						detonatorStatus: null,
						bridgeWire: null,
						calibration: null,
						program: null,
						boosterFired: null,
						tagged: null,
						logged: null,
						delay: null,
						windowId: 390
					}
				}
			];

			const packetTemplate = new PacketTemplate();

			const parser = new DataListParser(packetTemplate.incomingCommTemplate[22]);

			var testObj = {
				packet:
					"aaaa4416ffff1b4a100e7d011b4a100d7e011b4a100c7f011b4a100b80011b4a100a81011b4a100982011b4a100883011b4a100784011b4a100685011b4a7a7f860186ce",
				createdAt
			};

			const valid = await validator.validatePacket(
				testObj,
				packetTemplate.incomingCommTemplate[22].chunk
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

		it("can do a 16 packet", async function() {
			const createdAt = Date.now();

			const packetTemplate = new PacketTemplate();

			const parser = new DataListParser(packetTemplate.incomingCommTemplate[22]);

			var testObj = {
				packet:
					"aaaa4416000455983903e70050983903e80068983903e90073983903ea0076983903eb0052983903ec0069983903ed0056983903ee0029963903ef0026983903f000ba8b",
				createdAt
			};

			const valid = await validator.validatePacket(
				testObj,
				packetTemplate.incomingCommTemplate[22].chunk
			);

			let parsedPacketArr = await parser.parse(valid);

			let result = await parser.buildNodeData(parsedPacketArr);
			let res = result.map(item => {
				return {
					itemType: item.constructor.name,
					itemData: item.data
				};
			});

			console.log(res);
			//expect(res).to.deep.equal(expected);
		});
	});
});
