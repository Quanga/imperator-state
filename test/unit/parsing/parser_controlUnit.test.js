var assert = require("assert");

describe("UNIT - Parser", async function() {
	this.timeout(2000);

	context("CONTROL UNIT", async () => {
		it("can create a node result array with one set of node data from a parsed packet", async function() {
			/*
         AAAA 0A 08 0001 00C0 CA96 (event on IBC-1 id 0001 - key switch armed on IBC)
         */
			let now = Date.now();

			const expected = [
				{
					itemType: "ControlUnitModel",
					itemData: {
						serial: 1,
						typeId: 0,
						parentType: null,
						created: now,
						modified: null,
						path: "",
						communicationStatus: 1,
						keySwitchStatus: 1,
						fireButton: 0,
						cableFault: 0,
						isolationRelay: 1,
						earthLeakage: 0,
						blastArmed: 0
					}
				}
			];

			// let packet = { created: Date.now(), message: "AAAA0A08000100C0CA96" };
			// let packetService = new PacketService();

			// let parsed = await packetService.extractData(mockHappn, packet);
			// let packetArr = await packetService.buildNodeData(mockHappn, parsed);
			// let result = packetArr.map(ob => ob.data);
			// await assert.deepEqual(result, expected);
			const DataListParser = require("../../../lib/parsers/deviceDataParser");
			const PacketTemplate = require("../../../lib/constants/packetTemplates");

			const packetTemplate = new PacketTemplate();

			const parser = new DataListParser(packetTemplate.incomingCommTemplate[8]);

			const testObj = {
				packet: "AAAA0A08000100C0CA96",
				created: now
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
		});
	});
});
