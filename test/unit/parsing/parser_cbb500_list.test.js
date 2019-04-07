var assert = require("assert");

describe("parser-CBB500_LIST-parser-test", async function() {
	const MockHappn = require("../../mocks/mock_happn");
	var DataListParser = require("../../../lib/parsers/deviceListParser");
	const PacketTemplate = require("../../../lib/constants/packetTemplates");

	let mockHappn = new MockHappn();

	this.timeout(30000);

	before("it sets up the dependencies", async function() {});

	it("can create a result array with nodes containing CBB and EDD data from a parsed packet", async function() {
		var expected = [
			{
				itemType: "CBoosterModel",
				itemData: {
					serial: 65535,
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
					childCount: 10
				}
			},
			{
				itemType: "EDDModel",
				itemData: {
					serial: 457838606,
					parentSerial: 65535,
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
					windowId: 390
				}
			}
		];

		let test = async () => {
			try {
				const packetTemplate = new PacketTemplate();

				const parser = new DataListParser(
					packetTemplate.incomingCommTemplate[22]
				);

				var testObj = {
					packet:
            "aaaa4416ffff1b4a100e7d011b4a100d7e011b4a100c7f011b4a100b80011b4a100a81011b4a100982011b4a100883011b4a100784011b4a100685011b4a7a7f860186ce",
					created: Date.now()
				};

				let parsedPacketArr = await parser.parse(mockHappn, testObj);

				let result = await parser.buildNodeData(mockHappn, parsedPacketArr);
				let res = result.map(item => {
					return {
						itemType: item.constructor.name,
						itemData: item.data
					};
				});

				await assert.deepEqual(res, expected);
			} catch (err) {
				return Promise.reject(err);
			}
		};

		return test();
	});
});
