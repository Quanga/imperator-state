/**
 * Created by grant on 2016/06/17.
 */

var assert = require("assert");

describe("parser-edd-parser-test", async function() {
	const MockHappn = require("../mocks/mock_happn");
	const { PacketModel } = require("../../lib/models/packetModel");

	let mockHappn = new MockHappn();
	var parser = null;

	this.timeout(30000);

	it.only("can create a result array with nodes containing CBB & EDD data from a parsed packet", async function() {
		/*

         start  length  command   CBB serial    Data                    CRC
         AAAA   1C      05        0043          00001828ff00ff00        bf80
         */

		var expected = [];

		let test = async () => {
			try {
				var DataParser = require("../../lib/parsers/deviceDataParser");

				const PacketModel = require("../../lib/models/packetModel");

				var parser = null;
				const commTemplate = require("../../lib/constants/comm_templates");

				parser = new DataParser();

				const packetTemplate = new commTemplate();
				let template = packetTemplate.incomingCommTemplate[5];

				let packet =
					"aaaa4805004364000a291f01b80b20011c0c2101800c2201e40c2301480d2401ac0d2501100e2601740e2701d80e28013c0f2901a00f2a0104102b0168102c01cc102d0130114a5d";
				var testObj = new PacketModel(template, packet, 0);
				let parsedPacketArr = await parser.parse(mockHappn, testObj);
				let result = await parser.buildNodeData(mockHappn, parsedPacketArr);
				await assert.deepEqual(result, expected);
			} catch (err) {
				return Promise.reject(err);
			}
		};

		return test();
	});

	it.only("can process an edd delete command", async function() {
		/*
		aaaa0d040043ffffffffff8a44

         start  length  command   CBB serial    Data                    CRC
         AAAA   1C      05        0043          00001828ff00ff00        bf80
         */

		var expected = [];

		let test = async () => {
			try {
				let packet = "aaaa0d040043ffffffffff8a44";
				let testObj = new PacketModel(packet);
				let parsedPacketArr = await parser.parse(mockHappn, testObj);
				let result = await parser.buildNodeData(mockHappn, parsedPacketArr);
				//console.log(result);
				await assert.deepEqual(result, expected);
			} catch (err) {
				return Promise.reject(err);
			}
		};

		return test();
	});
});
