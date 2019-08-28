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
						deviceType: 0,
						firmware: 2,
						qos: 99,
						qosFiring: 0,
						cableFault: 0,
						elt: 0,
						min2: 0,
						min7: 0
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

		it("can parse a cfc packet2", async function() {
			/*
         AAAA 0A 08 0001 00C0 CA96 (event on IBC-1 id 0001 - key switch armed on IBC)
         */
			let now = Date.now();

			const expected = [
				{
					itemType: "CFCModel",
					itemData: {
						serial: 1,
						typeId: 5,
						createdAt: now,
						parentType: null,
						modifiedAt: null,
						path: "",
						firmware: 2,
						qos: 98,
						qosFiring: 0,
						cableFault: 0,
						elt: 0,
						deviceType: 0,
						min2: 1,
						min7: 0
					}
				}
			];

			const DataListParser = require("../../../lib/parsers/deviceDataParser");
			const PacketTemplate = require("../../../lib/constants/packetTemplates");

			const packetTemplate = new PacketTemplate();

			const parser = new DataListParser(packetTemplate.incomingCommTemplate[36]);
			//aaaa 0d 24 005b fd 00 0000 02 9157
			const testObj = {
				packet: "aaaa0d240001fb82f1000296c7",
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

		it("can parse a cfc packet3", async function() {
			/*
         AAAA 0A 08 0001 00C0 CA96 (event on IBC-1 id 0001 - key switch armed on IBC)
         */
			let now = Date.now();

			const expected = [
				{
					itemType: "CFCModel",
					itemData: {
						serial: 2,
						typeId: 5,
						createdAt: now,
						parentType: null,
						modifiedAt: null,
						path: "",
						firmware: 2,
						qos: 8,
						qosFiring: 0,
						cableFault: 0,
						elt: 0,
						deviceType: 0,
						min2: 0,
						min7: 0
					}
				}
			];

			const DataListParser = require("../../../lib/parsers/deviceDataParser");
			const PacketTemplate = require("../../../lib/constants/packetTemplates");

			const packetTemplate = new PacketTemplate();

			const parser = new DataListParser(packetTemplate.incomingCommTemplate[36]);
			//aaaa 0d 24 005b fd 00 0000 02 9157
			const testObj = {
				packet: "aaaa0d2400021502ef00025539",
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
