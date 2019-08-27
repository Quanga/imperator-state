var assert = require("assert");

describe("UNIT - Parser", async function() {
	this.timeout(2000);

	context("CFC", async () => {
		it("can parse a cfc packet", async function() {
			/*
         AAAA 0A 08 0001 00C0 CA96 (event on IBC-1 id 0001 - key switch armed on IBC)
         */
			let now = Date.now();

			const expected = [
				{
					itemType: "CFCModel",
					itemData: {
						serial: 91,
						typeId: 5,
						createdAt: now,
						parentType: null,
						modifiedAt: null,
						path: "",
						cfcData: null,
						firmware: 2,
						qos: 99,
						qosFiring: 0
					}
				}
			];

			const DataListParser = require("../../../lib/parsers/deviceDataParser");
			const PacketTemplate = require("../../../lib/constants/packetTemplates");

			const packetTemplate = new PacketTemplate();

			const parser = new DataListParser(packetTemplate.incomingCommTemplate[36]);
			//aaaa 0d 24 005b fd 00 0000 02 9157
			const testObj = {
				packet: "aaaa0d24005bfd000000029157",
				createdAt: now
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
