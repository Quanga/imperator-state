const chai = require("chai");
const expect = chai.expect;
chai.use(require("chai-match"));
const sinon = require("sinon");
const sinonChai = require("sinon-chai");
const chaiPromise = require("chai-as-promised");

describe("UNIT - Parser", async function() {
	this.timeout(2000);
	const MockHappn = require("../../mocks/mock_happn");
	var DataListParser = require("../../../lib/parsers/deviceListParser");
	const PacketTemplate = require("../../../lib/constants/packetTemplates");

	let mockHappn = new MockHappn();

	context("CBB500 LIST", async () => {
		it("can create a result array with nodes containing CBB and EDD data from a parsed packet", async function() {
			const created = Date.now();
			var expected = [
				{
					itemType: "CBoosterModel",
					itemData: {
						serial: 65535,
						typeId: 3,
						parentType: 0,
						created,
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
						childCount: null
					}
				},
				{
					itemType: "EDDModel",
					itemData: {
						serial: 457838606,
						parentSerial: 65535,
						typeId: 4,
						parentType: 3,
						created,
						modified: null,
						path: "",
						detonatorStatus: 0,
						bridgeWire: 0,
						calibration: 0,
						program: 0,
						boosterFired: 0,
						tagged: 0,
						logged: 0,
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
						created,
						modified: null,
						path: "",
						detonatorStatus: 0,
						bridgeWire: 0,
						calibration: 0,
						program: 0,
						boosterFired: 0,
						tagged: 0,
						logged: 0,
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
						created,
						modified: null,
						path: "",
						detonatorStatus: 0,
						bridgeWire: 0,
						calibration: 0,
						program: 0,
						boosterFired: 0,
						tagged: 0,
						logged: 0,
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
						created,
						modified: null,
						path: "",
						detonatorStatus: 0,
						bridgeWire: 0,
						calibration: 0,
						program: 0,
						boosterFired: 0,
						tagged: 0,
						logged: 0,
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
						created,
						modified: null,
						path: "",
						detonatorStatus: 0,
						bridgeWire: 0,
						calibration: 0,
						program: 0,
						boosterFired: 0,
						tagged: 0,
						logged: 0,
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
						created,
						modified: null,
						path: "",
						detonatorStatus: 0,
						bridgeWire: 0,
						calibration: 0,
						program: 0,
						boosterFired: 0,
						tagged: 0,
						logged: 0,
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
						created,
						modified: null,
						path: "",
						detonatorStatus: 0,
						bridgeWire: 0,
						calibration: 0,
						program: 0,
						boosterFired: 0,
						tagged: 0,
						logged: 0,
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
						created,
						modified: null,
						path: "",
						detonatorStatus: 0,
						bridgeWire: 0,
						calibration: 0,
						program: 0,
						boosterFired: 0,
						tagged: 0,
						logged: 0,
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
						created,
						modified: null,
						path: "",
						detonatorStatus: 0,
						bridgeWire: 0,
						calibration: 0,
						program: 0,
						boosterFired: 0,
						tagged: 0,
						logged: 0,
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
						created,
						modified: null,
						path: "",
						detonatorStatus: 0,
						bridgeWire: 0,
						calibration: 0,
						program: 0,
						boosterFired: 0,
						tagged: 0,
						logged: 0,
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
				created
			};

			let parsedPacketArr = await parser.parse(mockHappn, testObj);

			let result = await parser.buildNodeData(mockHappn, parsedPacketArr);
			let res = result.map(item => {
				return {
					itemType: item.constructor.name,
					itemData: item.data
				};
			});

			expect(res).to.deep.equal(expected);
		});
	});
});
