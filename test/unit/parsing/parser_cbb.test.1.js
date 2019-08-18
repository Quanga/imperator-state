const chai = require("chai");
const expect = chai.expect;
chai.use(require("chai-match"));

describe("UNIT - Parser", async function() {
	this.timeout(30000);
	const MockHappn = require("../../mocks/mock_happn");
	var DataListParser = require("../../../lib/parsers/deviceListParser");
	const PacketTemplate = require("../../../lib/constants/packetTemplates");

	let mockHappn = new MockHappn();

	context("CBB100 LIST - Command 04", async () => {
		it("can create an array of units containing CBB and EDD data from a packet", async function() {
			let now = Date.now();

			var expected = [
				{
					itemType: "CBoosterModel",
					itemData: {
						serial: 67,
						typeId: 3,
						parentType: 0,
						created: now,
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
						serial: 457435452,
						parentSerial: 67,
						typeId: 4,
						parentType: 3,
						created: now,
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
						windowId: 97
					}
				},
				{
					itemType: "EDDModel",
					itemData: {
						serial: 457435453,
						parentSerial: 67,
						typeId: 4,
						parentType: 3,
						created: now,
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
						windowId: 98
					}
				},
				{
					itemType: "EDDModel",
					itemData: {
						serial: 457435454,
						parentSerial: 67,
						typeId: 4,
						parentType: 3,
						created: now,
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
						windowId: 99
					}
				},
				{
					itemType: "EDDModel",
					itemData: {
						serial: 457435455,
						parentSerial: 67,
						typeId: 4,
						parentType: 3,
						created: now,
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
						windowId: 100
					}
				}
			];

			const packetTemplate = new PacketTemplate();

			const parser = new DataListParser(packetTemplate.incomingCommTemplate[4]);

			var testObj = {
				packet: "aaaa1c0400431b43e93c611b43e93d621b43e93e631b43e93f6414ac",
				created: now
			};

			let parsedPacketArr = await parser.parse(mockHappn, testObj);

			let result = await parser.buildNodeData(mockHappn, parsedPacketArr);
			let res = result.map(item => {
				return {
					itemType: item.constructor.name,
					itemData: item.data
				};
			});

			await expect(res).to.deep.equal(expected);
		});

		it("can process an edd delete command", async function() {
			/*
			aaaa0d040043ffffffffff8a44
	
			 start  length  command   CBB serial    Data                    CRC
			 AAAA   1C      05        0043          00001828ff00ff00        bf80
			 */

			let now = Date.now();

			var expected = [
				{
					itemType: "CBoosterModel",
					itemData: {
						serial: 67,
						typeId: 3,
						parentType: 0,
						created: now,
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
						serial: 4294967295,
						parentSerial: 67,
						typeId: 4,
						parentType: 3,
						created: now,
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
						windowId: 255
					}
				}
			];

			const packetTemplate = new PacketTemplate();

			const parser = new DataListParser(packetTemplate.incomingCommTemplate[4]);

			var testObj = {
				packet: "aaaa0d040043ffffffffff8a44",
				created: now
			};

			let parsedPacketArr = await parser.parse(mockHappn, testObj);

			let result = await parser.buildNodeData(mockHappn, parsedPacketArr);
			let res = result.map(item => {
				return {
					itemType: item.constructor.name,
					itemData: item.data
				};
			});

			await expect(res).to.deep.equal(expected);
		});
	});
});
