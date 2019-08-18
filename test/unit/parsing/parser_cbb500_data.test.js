const chai = require("chai");
const expect = chai.expect;
chai.use(require("chai-match"));

const MockHappn = require("../../mocks/mock_happn");

describe("UNIT - Parser", async function() {
	this.timeout(10000);
	let mockHappn = new MockHappn();

	context("CBB500 DATA", async () => {
		it("can create a result array with nodes containing CBB & EDD data from a parsed packet", async function() {
			/*

         start  length  command   CBB serial    Data                    CRC
         AAAA   1C      05        0043          00001828ff00ff00        bf80
         */
			let created = Date.now();

			const expected = [
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
						childCount: 0
					}
				},
				{
					itemType: "EDDModel",
					itemData: {
						serial: null,
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
						created,
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
						created,
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
						created,
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
						created,
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
						created,
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
						created,
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
						created,
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

			const DataListParser = require("../../../lib/parsers/deviceDataParser");
			const PacketTemplate = require("../../../lib/constants/packetTemplates");

			const packetTemplate = new PacketTemplate();

			const parser = new DataListParser(packetTemplate.incomingCommTemplate[23]);

			const testObj = {
				packet:
					"aaaa3017ffffed0101f023ee01015424ef0101b824f001011c25f101018025f20101e425f301014826f40101ac262665",
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

			await expect(res).to.deep.equal(expected);
		});

		it("can create a result array with nodes containing CBB & EDD data from a parsed packet with null", async function() {
			/*

         start  length  command   CBB serial    Data                    CRC
         AAAA   1C      05        0043          00001828ff00ff00        bf80
         */
			let created = Date.now();

			const expected = [
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
						childCount: 0
					}
				},
				{
					itemType: "EDDModel",
					itemData: {
						serial: null,
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
						created,
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
						created,
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
						created,
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
						created,
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
						created,
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
						created,
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
						created,
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

			const DataListParser = require("../../../lib/parsers/deviceDataParser");
			const PacketTemplate = require("../../../lib/constants/packetTemplates");

			const packetTemplate = new PacketTemplate();

			const parser = new DataListParser(packetTemplate.incomingCommTemplate[5]);

			const testObj = {
				packet:
					"aaaa4805009e64003a2901090000020964000309c80004092c01050990010609f401070958020809bc02090920030a0984030b09e8030c094c040d09b0040e0914050f0978057ba2",
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

			console.log(JSON.stringify(res, null, 2));

			await expect(res).to.deep.equal(expected);
		});
	});
});
