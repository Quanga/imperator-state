var assert = require("assert");

describe("PARSER-CBB500_DATA-parser-test", async function() {
	const MockHappn = require("../../mocks/mock_happn");
	let mockHappn = new MockHappn();

	this.timeout(30000);

	it("can create a result array with nodes containing CBB & EDD data from a parsed packet", async function() {
		/*

         start  length  command   CBB serial    Data                    CRC
         AAAA   1C      05        0043          00001828ff00ff00        bf80
         */
		let now = Date.now();

		const expected = [
			{
				itemType: "CBoosterModel",
				itemData: {
					serial: 65535,
					parentSerial: null,
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
					serial: null,
					parentSerial: 65535,
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
					created: now,
					modified: null,
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
					created: now,
					modified: null,
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
					created: now,
					modified: null,
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
					created: now,
					modified: null,
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
					created: now,
					modified: null,
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
					created: now,
					modified: null,
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
					created: now,
					modified: null,
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

		let test = async () => {
			try {
				const DataListParser = require("../../../lib/parsers/deviceDataParser");
				const PacketTemplate = require("../../../lib/constants/packetTemplates");

				const packetTemplate = new PacketTemplate();

				const parser = new DataListParser(
					packetTemplate.incomingCommTemplate[23]
				);

				const testObj = {
					packet:
						"aaaa3017ffffed0101f023ee01015424ef0101b824f001011c25f101018025f20101e425f301014826f40101ac262665",
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

				await assert.deepEqual(res, expected);
			} catch (err) {
				return Promise.reject(err);
			}
		};

		return test();
	});
});
