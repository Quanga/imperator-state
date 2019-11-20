const chai = require("chai");
const expect = chai.expect;
chai.use(require("chai-match"));
const PacketValidation = require("../../../lib/parsers/packetValidataion");

describe("UNIT - Parser", async function() {
	this.timeout(30000);
	var DataListParser = require("../../../lib/parsers/deviceListParser");
	const PacketTemplate = require("../../../lib/constants/packetTemplates");

	context("CBB100 LIST - Command 04", async () => {
		const validator = new PacketValidation();
		let now = Date.now();

		var expected = [
			{
				itemType: "CBoosterModel",
				itemData: {
					serial: 67,
					typeId: 3,
					parentType: 0,
					createdAt: now,
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
					childCount: null,
					packetSinceLastFiring: null,
					lostPackets: null,
				},
			},
			{
				itemType: "EDDModel",
				itemData: {
					serial: 457435452,
					parentSerial: 67,
					typeId: 4,
					parentType: 3,
					createdAt: now,
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
					windowId: 97,
				},
			},
			{
				itemType: "EDDModel",
				itemData: {
					serial: 457435453,
					parentSerial: 67,
					typeId: 4,
					parentType: 3,
					createdAt: now,
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
					windowId: 98,
				},
			},
			{
				itemType: "EDDModel",
				itemData: {
					serial: 457435454,
					parentSerial: 67,
					typeId: 4,
					parentType: 3,
					createdAt: now,
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
					windowId: 99,
				},
			},
			{
				itemType: "EDDModel",
				itemData: {
					serial: 457435455,
					parentSerial: 67,
					typeId: 4,
					parentType: 3,
					createdAt: now,
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
					windowId: 100,
				},
			},
		];

		const packetTemplate = new PacketTemplate();
		const parser = new DataListParser(packetTemplate.incomingCommTemplate[4]);

		it("can create an array of units containing CBB and EDD data from a packet", async function() {
			const testObj = {
				packet: "aaaa1c0400431b43e93c611b43e93d621b43e93e631b43e93f6414ac",
				createdAt: now,
			};
			const valid = await validator.validatePacket(
				testObj,
				packetTemplate.incomingCommTemplate[4].chunk,
			);

			const parsedPacketArr = await parser.parse(valid);

			const result = await parser.buildNodeData(parsedPacketArr);
			const res = result.map(item => {
				return {
					itemType: item.constructor.name,
					itemData: item.data,
				};
			});

			expect(res).to.deep.equal(expected);
		});

		it("can process an edd delete command", async function() {
			var expected = [
				{
					itemType: "CBoosterModel",
					itemData: {
						serial: 67,
						typeId: 3,
						parentType: 0,
						createdAt: now,
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
						packetSinceLastFiring: null,
						lostPackets: null,
					},
				},
				{
					itemType: "EDDModel",
					itemData: {
						serial: 4294967295,
						parentSerial: 67,
						typeId: 4,
						parentType: 3,
						createdAt: now,
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
						windowId: 255,
					},
				},
			];

			const packetTemplate = new PacketTemplate();

			const parser = new DataListParser(packetTemplate.incomingCommTemplate[4]);

			const testObj = {
				packet: "aaaa0d040043ffffffffff8a44",
				createdAt: now,
			};

			const valid = await validator.validatePacket(
				testObj,
				packetTemplate.incomingCommTemplate[4].chunk,
			);

			const parsedPacketArr = await parser.parse(valid);

			const result = await parser.buildNodeData(parsedPacketArr);
			const res = result.map(item => {
				return {
					itemType: item.constructor.name,
					itemData: item.data,
				};
			});

			expect(res).to.deep.equal(expected);
		});
	});
});
