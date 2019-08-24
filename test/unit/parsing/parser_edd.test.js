var assert = require("assert");

describe("UNIT - Parser", async function() {
	this.timeout(30000);
	context("CBB100 DATA - Command 05", async () => {
		it("can create a result array with nodes containing CBB & EDD data from a parsed packet", async function() {
			/*

         start  length  command   CBB serial    Data                    CRC
         AAAA   1C      05        0043          00001828ff00ff00        bf80
         */

			const createTime = Date.now();

			const expected = [
				{
					itemType: "CBoosterModel",
					itemData: {
						serial: 67,
						typeId: 3,
						parentType: 0,
						created: createTime,
						modified: null,
						path: "",
						communicationStatus: 1,
						blastArmed: 0,
						keySwitchStatus: 1,
						isolationRelay: 0,
						mains: 0,
						lowBat: 0,
						tooLowBat: 0,
						dcSupplyVoltage: 1,
						shaftFault: 0,
						cableFault: 0,
						earthLeakage: 0,
						ledState: 8,
						childCount: 100
					}
				},
				{
					itemType: "EDDModel",
					itemData: {
						serial: null,
						parentSerial: 67,
						typeId: 4,
						parentType: 3,
						created: createTime,
						modified: null,
						path: "",
						detonatorStatus: 0,
						bridgeWire: 0,
						calibration: 0,
						program: 0,
						boosterFired: 0,
						tagged: 0,
						logged: 1,
						delay: 1500,
						windowId: 16
					}
				},
				{
					itemType: "EDDModel",
					itemData: {
						serial: null,
						parentSerial: 67,
						typeId: 4,
						parentType: 3,
						created: createTime,
						modified: null,
						path: "",
						detonatorStatus: 0,
						bridgeWire: 0,
						calibration: 0,
						program: 0,
						boosterFired: 0,
						tagged: 0,
						logged: 1,
						delay: 1600,
						windowId: 17
					}
				},
				{
					itemType: "EDDModel",
					itemData: {
						serial: null,
						parentSerial: 67,
						typeId: 4,
						parentType: 3,
						created: createTime,
						modified: null,
						path: "",
						detonatorStatus: 0,
						bridgeWire: 0,
						calibration: 0,
						program: 0,
						boosterFired: 0,
						tagged: 0,
						logged: 1,
						delay: 1700,
						windowId: 18
					}
				},
				{
					itemType: "EDDModel",
					itemData: {
						serial: null,
						parentSerial: 67,
						typeId: 4,
						parentType: 3,
						created: createTime,
						modified: null,
						path: "",
						detonatorStatus: 0,
						bridgeWire: 0,
						calibration: 0,
						program: 0,
						boosterFired: 0,
						tagged: 0,
						logged: 1,
						delay: 1800,
						windowId: 19
					}
				},
				{
					itemType: "EDDModel",
					itemData: {
						serial: null,
						parentSerial: 67,
						typeId: 4,
						parentType: 3,
						created: createTime,
						modified: null,
						path: "",
						detonatorStatus: 0,
						bridgeWire: 0,
						calibration: 0,
						program: 0,
						boosterFired: 0,
						tagged: 0,
						logged: 1,
						delay: 1900,
						windowId: 20
					}
				},
				{
					itemType: "EDDModel",
					itemData: {
						serial: null,
						parentSerial: 67,
						typeId: 4,
						parentType: 3,
						created: createTime,
						modified: null,
						path: "",
						detonatorStatus: 0,
						bridgeWire: 0,
						calibration: 0,
						program: 0,
						boosterFired: 0,
						tagged: 0,
						logged: 1,
						delay: 2000,
						windowId: 21
					}
				},
				{
					itemType: "EDDModel",
					itemData: {
						serial: null,
						parentSerial: 67,
						typeId: 4,
						parentType: 3,
						created: createTime,
						modified: null,
						path: "",
						detonatorStatus: 0,
						bridgeWire: 0,
						calibration: 0,
						program: 0,
						boosterFired: 0,
						tagged: 0,
						logged: 1,
						delay: 2100,
						windowId: 22
					}
				},
				{
					itemType: "EDDModel",
					itemData: {
						serial: null,
						parentSerial: 67,
						typeId: 4,
						parentType: 3,
						created: createTime,
						modified: null,
						path: "",
						detonatorStatus: 0,
						bridgeWire: 0,
						calibration: 0,
						program: 0,
						boosterFired: 0,
						tagged: 0,
						logged: 1,
						delay: 2200,
						windowId: 23
					}
				},
				{
					itemType: "EDDModel",
					itemData: {
						serial: null,
						parentSerial: 67,
						typeId: 4,
						parentType: 3,
						created: createTime,
						modified: null,
						path: "",
						detonatorStatus: 0,
						bridgeWire: 0,
						calibration: 0,
						program: 0,
						boosterFired: 0,
						tagged: 0,
						logged: 1,
						delay: 2300,
						windowId: 24
					}
				},
				{
					itemType: "EDDModel",
					itemData: {
						serial: null,
						parentSerial: 67,
						typeId: 4,
						parentType: 3,
						created: createTime,
						modified: null,
						path: "",
						detonatorStatus: 0,
						bridgeWire: 0,
						calibration: 0,
						program: 0,
						boosterFired: 0,
						tagged: 0,
						logged: 1,
						delay: 2400,
						windowId: 25
					}
				},
				{
					itemType: "EDDModel",
					itemData: {
						serial: null,
						parentSerial: 67,
						typeId: 4,
						parentType: 3,
						created: createTime,
						modified: null,
						path: "",
						detonatorStatus: 0,
						bridgeWire: 0,
						calibration: 0,
						program: 0,
						boosterFired: 0,
						tagged: 0,
						logged: 1,
						delay: 2500,
						windowId: 26
					}
				},
				{
					itemType: "EDDModel",
					itemData: {
						serial: null,
						parentSerial: 67,
						typeId: 4,
						parentType: 3,
						created: createTime,
						modified: null,
						path: "",
						detonatorStatus: 0,
						bridgeWire: 0,
						calibration: 0,
						program: 0,
						boosterFired: 0,
						tagged: 0,
						logged: 1,
						delay: 2600,
						windowId: 27
					}
				},
				{
					itemType: "EDDModel",
					itemData: {
						serial: null,
						parentSerial: 67,
						typeId: 4,
						parentType: 3,
						created: createTime,
						modified: null,
						path: "",
						detonatorStatus: 0,
						bridgeWire: 0,
						calibration: 0,
						program: 0,
						boosterFired: 0,
						tagged: 0,
						logged: 1,
						delay: 2700,
						windowId: 28
					}
				},
				{
					itemType: "EDDModel",
					itemData: {
						serial: null,
						parentSerial: 67,
						typeId: 4,
						parentType: 3,
						created: createTime,
						modified: null,
						path: "",
						detonatorStatus: 0,
						bridgeWire: 0,
						calibration: 0,
						program: 0,
						boosterFired: 0,
						tagged: 0,
						logged: 1,
						delay: 2800,
						windowId: 29
					}
				},
				{
					itemType: "EDDModel",
					itemData: {
						serial: null,
						parentSerial: 67,
						typeId: 4,
						parentType: 3,
						created: createTime,
						modified: null,
						path: "",
						detonatorStatus: 0,
						bridgeWire: 0,
						calibration: 0,
						program: 0,
						boosterFired: 0,
						tagged: 0,
						logged: 1,
						delay: 2900,
						windowId: 30
					}
				}
			];

			let test = async () => {
				try {
					const DataListParser = require("../../../lib/parsers/deviceDataParser");
					const PacketTemplate = require("../../../lib/constants/packetTemplates");

					const packetTemplate = new PacketTemplate();

					const parser = new DataListParser(packetTemplate.incomingCommTemplate[5]);

					const testObj = {
						packet:
							"aaaa4805004364008a211001dc05110140061201a4061301080714016c071501d00716013408170198081801fc08190160091a01c4091b01280a1c018c0a1d01f00a1e01540b8f97",
						created: createTime
					};

					let parsedPacketArr = await parser.parse(testObj);
					let result = await parser.buildNodeData(parsedPacketArr);

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

		it("can test an packet", async function() {
			const DataListParser = require("../../../lib/parsers/deviceDataParser");
			const PacketTemplate = require("../../../lib/constants/packetTemplates");

			const packetTemplate = new PacketTemplate();

			const parser = new DataListParser(packetTemplate.incomingCommTemplate[5]);

			const testObj = {
				//packet: "aaaa0c05fffff40118607f2f",
				packet: "aaaa0c05002762001929d64e",
				created: Date.now()
			};

			let parsedPacketArr = await parser.parse(testObj);
			let result = await parser.buildNodeData(parsedPacketArr);

			let res = result.map(item => {
				return {
					itemType: item.constructor.name,
					itemData: item.data
				};
			});
			console.log("RESULT", res);

			//await assert.deepEqual(res, expected);
		});
	});
});
