var assert = require("assert");

describe("parser-CBB500_DATA-parser-test", async function() {
	const MockHappn = require("../../mocks/mock_happn");
	let mockHappn = new MockHappn();

	this.timeout(30000);

	it("can create a result array with nodes containing CBB & EDD data from a parsed packet", async function() {
		/*

         start  length  command   CBB serial    Data                    CRC
         AAAA   1C      05        0043          00001828ff00ff00        bf80
         */

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
					ledState: undefined,
					childCount: undefined
				}
			},
			{
				itemType: "EDDModel",
				itemData: {
					serial: null,
					parentSerial: 65535,
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

	it("can create a result array with nodes containing CBB & EDD from another packet", async function() {
		/*

         start  length  command   CBB serial    Data                    CRC
         AAAA   1C      05        0043          00001828ff00ff00        bf80
         */

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
					ledState: undefined,
					childCount: undefined
				}
			},
			{
				itemType: "EDDModel",
				itemData: {
					serial: null,
					parentSerial: 65535,
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
					delay: 4000,
					windowId: 1
				}
			},
			{
				itemType: "EDDModel",
				itemData: {
					serial: null,
					parentSerial: 65535,
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
					delay: 100,
					windowId: 2
				}
			},
			{
				itemType: "EDDModel",
				itemData: {
					serial: null,
					parentSerial: 65535,
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
					delay: 200,
					windowId: 3
				}
			},
			{
				itemType: "EDDModel",
				itemData: {
					serial: null,
					parentSerial: 65535,
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
					delay: 300,
					windowId: 4
				}
			},
			{
				itemType: "EDDModel",
				itemData: {
					serial: null,
					parentSerial: 65535,
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
					delay: 400,
					windowId: 5
				}
			},
			{
				itemType: "EDDModel",
				itemData: {
					serial: null,
					parentSerial: 65535,
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
					delay: 500,
					windowId: 6
				}
			},
			{
				itemType: "EDDModel",
				itemData: {
					serial: null,
					parentSerial: 65535,
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
					delay: 600,
					windowId: 7
				}
			},
			{
				itemType: "EDDModel",
				itemData: {
					serial: null,
					parentSerial: 65535,
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
					delay: 700,
					windowId: 8
				}
			},
			{
				itemType: "EDDModel",
				itemData: {
					serial: null,
					parentSerial: 65535,
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
					delay: 800,
					windowId: 9
				}
			},
			{
				itemType: "EDDModel",
				itemData: {
					serial: null,
					parentSerial: 65535,
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
					delay: 900,
					windowId: 10
				}
			},
			{
				itemType: "EDDModel",
				itemData: {
					serial: null,
					parentSerial: 65535,
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
					delay: 1000,
					windowId: 11
				}
			},
			{
				itemType: "EDDModel",
				itemData: {
					serial: null,
					parentSerial: 65535,
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
					delay: 1100,
					windowId: 12
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
            "aaaa4417ffff010001a00f0200016400030001c8000400012c010500019001060001f4010700015802080001bc0209000120030a000184030b0001e8030c00014c04191f",
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
				console.log(res);
				//await assert.deepEqual(res, expected);
			} catch (err) {
				return Promise.reject(err);
			}
		};

		return test();
	});
});

//aaaa0c05ffff64001929715d
//aaaa4416ffff1b3c5efe01001b45531702001b45531603001b45531504001b45531405001b45531306001b45531207001b45531108001b45531009001b45530f0a004e45
//aaaa4417ffff01007300000200736400030073c8000400732c010500739001060073f4010700735802080073bc0209007320030a007384030b0073e8030c00734c040055

//01007300
//00020073
//60003007
//3c800040
//0732c010
//50073900
//1060073f
//40107007
//35802080
//073bc020
//90073200
//30a00738
//4030b007
//3e8030c0
//0734c040
//055
