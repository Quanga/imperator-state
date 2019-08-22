const chai = require("chai");
const expect = chai.expect;
chai.use(require("chai-match"));

const CRC = require("../../../lib/utils/crc");

describe("UNIT - Utils", async function() {
	context("CRC", async () => {
		it("can calculate the CRC of a packet with event on IBC-1 serial 0001 and key switch disarmed on IBC", async function() {
			// AAAA 0A 08 0001 5540 C212
			const expected = 0xc212;
			const expectedHex = "c212";

			const result = CRC.generateCRC("AAAA0A0800015540");
			expect(result.toString(16)).to.be.equal(expectedHex);
			expect(result).to.be.equal(expected);
			console.log(result.toString(16));
		});

		it("can calculate the CRC of a packet with event on IBC-1 serial 0001 and key switch armed on IBC", async () => {
			// AAAA 0A 08 0001 55C0 CA96

			var expected = 0xca96;
			var result = CRC.generateCRC("AAAA0A08000155C0");
			expect(result).to.be.equal(expected);
		});

		it("can calculate the CRC of a packet with buffer", async () => {
			// AAAA 0A 08 0001 55C0 CA96
			const hexval = [170, 170, 10, 8, 0, 1, 85, 192];
			const expected = 0xca96;
			const result = CRC.generateCRC(hexval);
			expect(result).to.be.equal(expected);
		});

		it("can calculate the CRC of a packet where the CRC starts with a 0", async () => {
			// AAAA 0A 03 0001 4040 07BE

			const expected = 0x07be;
			const result = CRC.generateCRC("AAAA0A0300014040");
			expect(result).to.be.equal(expected);
		});
	});
});
