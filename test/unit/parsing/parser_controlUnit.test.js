var assert = require("assert");

describe("PARSER-control-unit-parser-test", async function() {
	const MockHappn = require("../../mocks/mock_happn");
	let mockHappn = new MockHappn();

	this.timeout(2000);

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
					parentSerial: null,
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

		let test = async () => {
			try {
				// let packet = { created: Date.now(), message: "AAAA0A08000100C0CA96" };
				// let packetService = new PacketService();

				// let parsed = await packetService.extractData(mockHappn, packet);
				// let packetArr = await packetService.buildNodeData(mockHappn, parsed);
				// let result = packetArr.map(ob => ob.data);
				// await assert.deepEqual(result, expected);
				const DataListParser = require("../../../lib/parsers/deviceDataParser");
				const PacketTemplate = require("../../../lib/constants/packetTemplates");

				const packetTemplate = new PacketTemplate();

				const parser = new DataListParser(
					packetTemplate.incomingCommTemplate[8]
				);

				const testObj = {
					packet: "AAAA0A08000100C0CA96",
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
