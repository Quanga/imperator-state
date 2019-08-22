const chai = require("chai");
const expect = chai.expect;
chai.use(require("chai-match"));

var Utils = require("../../../lib/utils/packet_utils");
var utils = null;

var MockHappn = require("../../mocks/mock_happn");
var mockHappn = new MockHappn();

describe("UNIT - Utils", async function() {
	context("packetUtils", async () => {
		before(async () => {
			utils = new Utils();
		});

		it("can create an outgoing packet requesting ISC serial list with a valid CRC", async () => {
			// AAAA 01 0001 DD5C

			var expected = "AAAA010001DD5C".match(/.{1,2}/g).map(x => {
				return parseInt(x, 16);
			});

			var command = 0b00000001;
			var serial = 0b0000000000000001;

			var result = utils.buildOutgoingPacket(mockHappn, command, serial);

			expect(result).to.deep.equal(expected);
		});

		it("can create an outgoing packet requesting ISC and IB651 general info with a valid CRC", async () => {
			// AAAA 03 0007 538C
			// [ 170, 170, 3, 0, 7, 83, 140 ]

			var expected = "AAAA030007538C".match(/.{1,2}/g).map(x => {
				return parseInt(x, 16);
			});

			const command = 0b00000011;
			const serial = 0b0000000000000111;

			var result = utils.buildOutgoingPacket(mockHappn, command, serial);
			var result2 = utils.buildOutgoingPacket(mockHappn, 3, 7);

			console.log(expected);
			expect(result).to.deep.equal(expected);
			expect(result2).to.deep.equal(expected);
		});
	});
});
