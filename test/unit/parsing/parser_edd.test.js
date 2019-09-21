/* eslint-disable no-unused-vars */
const chai = require("chai");
const expect = chai.expect;
chai.use(require("chai-match"));
const PacketValidation = require("../../../lib/parsers/packetValidataion");
const fs = require("fs");
const path = require("path");
//const util = require("../../helpers");
const moment = require("moment");

describe("UNIT - Parser", async function() {
	this.timeout(30000);
	context("CBB100 DATA - Command 05", async () => {
		const createTime = Date.now();
		const validator = new PacketValidation();

		it("can create a result array with nodes containing CBB & EDD data from a parsed packet", async function() {
			/*

         start  length  command   CBB serial    Data                    CRC
         AAAA   1C      05        0043          00001828ff00ff00        bf80
         */

			const expected = [
				{
					itemType: "CBoosterModel",
					itemData: {
						serial: 67,
						typeId: 3,
						parentType: 0,
						createdAt: createTime,
						modifiedAt: null,
						path: "",
						communicationStatus: 1,
						blastArmed: 0,
						keySwitchStatus: 1,
						isolationRelay: 0,
						mains: 0,
						lowBat: 0,
						lfs: 1,
						tooLowBat: 0,
						dcSupplyVoltage: 1,
						shaftFault: 0,
						cableFault: 0,
						earthLeakage: 0,
						ledState: 8,
						childCount: 100,
						lostPackets: null,
						packetSinceLastFiring: null
					}
				},
				{
					itemType: "EDDModel",
					itemData: {
						serial: null,
						parentSerial: 67,
						typeId: 4,
						parentType: 3,
						createdAt: createTime,
						modifiedAt: null,
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
						createdAt: createTime,
						modifiedAt: null,
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
						createdAt: createTime,
						modifiedAt: null,
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
						createdAt: createTime,
						modifiedAt: null,
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
						createdAt: createTime,
						modifiedAt: null,
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
						createdAt: createTime,
						modifiedAt: null,
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
						createdAt: createTime,
						modifiedAt: null,
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
						createdAt: createTime,
						modifiedAt: null,
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
						createdAt: createTime,
						modifiedAt: null,
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
						createdAt: createTime,
						modifiedAt: null,
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
						createdAt: createTime,
						modifiedAt: null,
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
						createdAt: createTime,
						modifiedAt: null,
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
						createdAt: createTime,
						modifiedAt: null,
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
						createdAt: createTime,
						modifiedAt: null,
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
						createdAt: createTime,
						modifiedAt: null,
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

			const DataListParser = require("../../../lib/parsers/deviceDataParser");
			const PacketTemplate = require("../../../lib/constants/packetTemplates");

			const packetTemplate = new PacketTemplate();

			const parser = new DataListParser(packetTemplate.incomingCommTemplate[5]);

			const testObj = {
				packet:
					"aaaa4805004364008a211001dc05110140061201a4061301080714016c071501d00716013408170198081801fc08190160091a01c4091b01280a1c018c0a1d01f00a1e01540b8f97",
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

		it("can test an packet", async function() {
			const DataListParser = require("../../../lib/parsers/deviceDataParser");
			const PacketTemplate = require("../../../lib/constants/packetTemplates");

			const packetTemplate = new PacketTemplate();

			const parser = new DataListParser(packetTemplate.incomingCommTemplate[5]);

			const p2 = [
				{
					packet: "aaaa0c05004d000d002a328c",
					createdAt: 1567152123000
				}
			];

			// const testObj = {
			// 	packet: "aaaa1805004d300029292e0964002f0996003009af002652",
			// 	createdAt: Date.now()
			// };

			let resArr = [];

			for (const packetOb of p2) {
				packetOb.createdAt = moment(packetOb.createdAt).format("x");
				console.log(packetOb);

				const valid = await validator.validatePacket(
					packetOb,
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
				//console.log(res);
				resArr.push(res);
			}

			//fs.writeFileSync(path.resolve(__dirname, `./ALL.txt`), JSON.stringify(resArr, null, 2));
			// const valid = await validator.validatePacket(
			// 	testObj,
			// 	packetTemplate.incomingCommTemplate[5].chunk
			// );
			//await util.timer(1000);
			// let parsedPacketArr = await parser.parse(valid);
			// let result = await parser.buildNodeData(parsedPacketArr);

			// let res = result.map(item => {
			// 	return {
			// 		itemType: item.constructor.name,
			// 		itemData: item.data
			// 	};
			// });
			// console.log("RESULT", res);

			//await assert.deepEqual(res, expected);
		});
	});
});
