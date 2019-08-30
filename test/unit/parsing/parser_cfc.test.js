const chai = require("chai");
const expect = chai.expect;
chai.use(require("chai-match"));
const PacketValidation = require("../../../lib/parsers/packetValidataion");

describe("UNIT - Parser", async function() {
	this.timeout(2000);

	context("CFC", async () => {
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
		const validator = new PacketValidation();
		const packetTemplate = new PacketTemplate();
		const parser = new DataListParser(packetTemplate.incomingCommTemplate[36]);

		it("can parse a cfc packet", async function() {
			const testObj = {
				packet: "aaaa0d24005bfd000000029157",
				createdAt: now
			};

			const valid = await validator.validatePacket(
				testObj,
				packetTemplate.incomingCommTemplate[36].chunk
			);

			//aaaa 0d 24 005b fd00000002 9157

			/*
			{ createdAt: 1567138342914,
  			packetSerial: 91,
  			command: 36,
  			dataPackets: [ 'fd00000002' ] }
  			*/

			const parsedPacketArr = await parser.parse(valid);
			const result = await parser.buildNodeData(parsedPacketArr);

			const res = result.map(item => {
				return {
					itemType: item.constructor.name,
					itemData: item.data
				};
			});

			expect(res).to.deep.equal(expected);
		});

		it("can parse a cfc packet2", async function() {
			const testObj = {
				packet: "aaaa0d240001fb82f1000296c7",
				createdAt: now
			};

			const valid = await validator.validatePacket(
				testObj,
				packetTemplate.incomingCommTemplate[36].chunk
			);

			//aaaa0d240001 fb82f10002 96c7

			/*
			{ createdAt: 1567138608009,
  			packetSerial: 1,
  			command: 36,
  			dataPackets: [ 'fb82f10002' ] }
  			*/

			const parsedPacketArr = await parser.parse(valid);
			const result = await parser.buildNodeData(parsedPacketArr);

			const res = result.map(item => {
				return {
					itemType: item.constructor.name,
					itemData: item.data
				};
			});

			const expectedDiff = {
				...expected[0],
				itemData: { ...expected[0].itemData, qos: 98, serial: 1, min2: 1 }
			};

			expect(res[0]).to.deep.equal(expectedDiff);
		});

		it("can parse a cfc packet3", async function() {
			const testObj = {
				packet: "aaaa0d2400021502ef00025539",
				createdAt: now
			};

			const valid = await validator.validatePacket(
				testObj,
				packetTemplate.incomingCommTemplate[36].chunk
			);

			//aaaa 0d 24 0002 1502ef0002 5539
			//                   ^^^^
			// after packet validation
			/*{ createdAt: 1567138697438,
  				packetSerial: 2,
  				command: 36,
  				dataPackets: [ '1502ef0002' ] }*/

			const parsedPacketArr = await parser.parse(valid);
			const result = await parser.buildNodeData(parsedPacketArr);

			const res = result.map(item => {
				return {
					itemType: item.constructor.name,
					itemData: item.data
				};
			});

			const expectedDiff = {
				...expected[0],
				itemData: { ...expected[0].itemData, qos: 8, serial: 2, min2: 0 }
			};

			expect(res[0]).to.deep.equal(expectedDiff);
		});
	});
});
