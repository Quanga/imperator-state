var assert = require("assert");

describe("UTILS-packetUtils-test", function() {
	var Utils = require("../../../lib/utils/packet_utils");
	var utils = null;

	var MockHappn = require("../../mocks/mock_happn");
	var mockHappn = new MockHappn();

	this.timeout(10000);

	before("it sets up the dependencies", function(callback) {
		utils = new Utils();
		callback();
	});

	it("can calculate the correct packet length", async function() {
		/*
         AAAA 0A 03 0001 4040 07BE
         */
		try {
			var expected = "0a";
			var result = utils.calculatePacketLength("03", "0001", "4040"); // incoming CRC stripped off end
			assert.equal(result, expected);
		} catch (err) {
			return Promise.reject(err);
		}
	});

	it("can calculate the CRC of a packet with event on IBC-1 serial 0001 and key switch disarmed on IBC", async function() {
		// AAAA 0A 08 0001 5540 C212 (event on IBC-1 id 0001 - key switch disarmed on IBC)

		try {
			var expected = 0xc212;
			var result = utils.generateCRC("AAAA0A0800015540"); // incoming CRC stripped off end
			assert.equal(result, expected);
		} catch (err) {
			return Promise.reject(err);
		}
	});

	it("can calculate the CRC of a packet with event on IBC-1 serial 0001 and key switch armed on IBC", function(callback) {
		// AAAA 0A 08 0001 55C0 CA96 (event on IBC-1 id 0001 - key switch armed on IBC)

		var expected = 0xca96;
		var result = utils.generateCRC("AAAA0A08000155C0"); // incoming CRC stripped off end
		assert.equal(result, expected);
		callback();
	});

	it("can calculate the CRC of a packet with event on IBC-1 serial 0001 and key switch armed on IBC with buffer", function(callback) {
		// AAAA 0A 08 0001 55C0 CA96 (event on IBC-1 id 0001 - key switch armed on IBC)
		let hexval = [170, 170, 10, 8, 0, 1, 85, 192];
		var expected = 0xca96;
		var result = utils.generateCRC(hexval); // incoming CRC stripped off end
		assert.equal(result, expected);
		callback();
	});

	it("can calculate the CRC of a packet where the CRC starts with a 0", function(callback) {
		// AAAA 0A 03 0001 4040 07BE

		var expected = 0x07be;
		var result = utils.generateCRC("AAAA0A0300014040"); // incoming CRC stripped off end
		assert.equal(result, expected);
		callback();
	});

	it("can create an outgoing packet requesting ISC serial list with a valid CRC", function(callback) {
		// AAAA 01 0001 DD5C

		var expected = "AAAA010001DD5C".match(/.{1,2}/g).map(x => {
			return parseInt(x, 16);
		});

		var command = 0b00000001;
		var serial = 0b0000000000000001;

		var result = utils.buildOutgoingPacket(mockHappn, command, serial);

		assert.deepEqual(result, expected);
		callback();
	});

	it("can create an outgoing packet requesting ISC and IB651 general info with a valid CRC", function(callback) {
		// AAAA 03 0007 538C

		var expected = "AAAA030007538C".match(/.{1,2}/g).map(x => {
			return parseInt(x, 16);
		});

		var command = 0b00000011;
		var serial = 0b0000000000000111;

		var result = utils.buildOutgoingPacket(mockHappn, command, serial);

		assert.deepEqual(result, expected);
		callback();
	});

	it("can check for duplicates in list", async function() {
		let list1 = [{ serial: 1 }, { serial: 2 }, { serial: 3 }];

		try {
			let current = { serial: 2 };

			let result = await utils.checkForNoDuplicate(list1, current);
			assert.equal(result, 0);

			current = { serial: 1 };
			result = await utils.checkForNoDuplicate(list1, current);
			assert.equal(result, 1);
		} catch (err) {
			return Promise.reject(err);
		}
	});

	it("can reverse serial bytes", async function() {
		try {
			let result = utils.reverseSerialBytes(123);
			assert.equal(result, 31488);

			let result2 = utils.reverseSerialBytes(256);
			assert.equal(result2, 1);
		} catch (err) {
			return Promise.reject(err);
		}
	});

	it("can pad an item", async function() {
		try {
			let result = utils.pad("93", 16);
			assert.equal(result, "0000000000000093");
		} catch (err) {
			return Promise.reject(err);
		}
	});

	it("can convert Binary to hex string", async function() {
		try {
			let result = utils.binaryToHexString("01001010", 16);
			assert.equal(result, "000000000000004a");
		} catch (err) {
			return Promise.reject(err);
		}
	});

	it("can convert Hex to binary", async function() {
		try {
			let result = utils.hexToBinaryString("AAAA", 16);
			assert.equal(result, "1010101010101010");
		} catch (err) {
			return Promise.reject(err);
		}
	});
});
