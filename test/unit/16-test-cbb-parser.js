/**
 * Created by grant on 2016/06/17.
 */

var assert = require("assert");

describe("cbb-parser-test", async function() {
	const MockHappn = require("../mocks/mock_happn");
	var DataListParser = require("../../lib/parsers/deviceListParser");
	const commTemplate = require("../../lib/constants/comm_templates");

	let mockHappn = new MockHappn();

	this.timeout(30000);

	before("it sets up the dependencies", async function() {});

	it("can create a result array with nodes containing CBB and EDD data from a parsed packet", async function() {
		/*

         start  length  command CBB serial  Data                                      data  CRC
         AAAA   1C      04      0043        1b43e93c611b43e93d621b43e93e631b43e93f64        14ac
         */

		// NOTE: top-level IBC does not have a parent_id (ie: null)
		// NOTE: IB651 serial is unknown (ie: null) - this will ultimately be retrieved from the DB

		var expected = [];

		let test = async () => {
			try {
				const PacketModel = require("../../lib/models/packetModel");

				var parser = null;
				parser = new DataListParser();

				const packetTemplate = new commTemplate();
				let template = packetTemplate.incomingCommTemplate[4];

				let packet = "aaaa1c0400431b43e93c611b43e93d621b43e93e631b43e93f6414ac";
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
});
