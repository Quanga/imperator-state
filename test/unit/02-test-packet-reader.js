/**
 * Created by grant on 2016/06/23.
 */

var assert = require("assert");

describe("packet-reader-test", function() {
	//const Parser = require("@serialport/parser-readline");
	const Delimiter = require("@serialport/parser-delimiter");

	let parser = null;

	this.timeout(2000);

	before("it sets up the dependencies", function(callback) {
		parser = new Delimiter({
			delimiter: Buffer.from("AAAA", "hex"),
			encoding: "hex"
			//includeDelimiter: true
		});

		callback();
	});

	it("can parse a default IBC message with delimiting bytes at the beginning of the message ", function(callback) {
		var testMessage = "AAAA0A0800015540C212";

		parser.on("data", logme);
		parser.on("error", console.log);

		parser.write(Buffer.from(testMessage, "hex"), endCall);

		function endCall() {
			parser.end();
		}

		function logme(message) {
			console.log(`logging - aaaa${message.toString()}`);
			assert.equal(`aaaa${message.toString()}`, testMessage.toLowerCase());
			callback();
		}
		setTimeout(() => {
			callback();
		}, 4000);
	});

	it("can parse a message with ISC serial list with 1 ISC and  delimiting bytes at the beginning of the message ", async function() {
		var testMessage = "AAAA0A010001002542DA";

		var func = parser.readline("AAAA");

		var emitter = {
			emit: function(eventName, data) {
				console.log("data -------------------", data);
				console.log("message -------------------", testMessage);

				assert.equal(data, testMessage.toLowerCase());
				callback();
			}
		};

		func(emitter, new Buffer(testMessage, "hex"));
	});

	it("can parse a message with ISC serial list with 2 ISCs and  delimiting bytes at the beginning of the message ", function(callback) {
		var testMessage = "AAAA0C01000100250026AC51";

		var func = parser.readline("AAAA");

		var emitter = {
			emit: function(eventName, data) {
				assert.equal(data, testMessage.toLowerCase());
				callback();
			}
		};

		func(emitter, new Buffer(testMessage, "hex"));
	});

	it("can parse a default message with one set of delimiting bytes in the middle of the message ", function(callback) {
		var expected = "AAAA0A0800015540C212";
		var testMessage = "55C0CA96AAAA0A0800015540C212";

		var func = parser.readline("AAAA");

		var emitter = {
			emit: function(eventName, data) {
				assert.equal(data, expected.toLowerCase());
				callback();
			}
		};

		func(emitter, new Buffer(testMessage, "hex"));
	});

	it("can parse a message with multiple sets of delimiting bytes in the middle of the message ", function(callback) {
		var expected1 = "AAAA0A0800015540C212";
		var expected2 = "AAAA0A08000155C0CA96";
		var testMessage1 = "55C0CA96AAAA0A0800015540C212AAAA0A0800";
		var testMessage2 = "0155C0CA96AAAA1600F6";

		var func = parser.readline("AAAA");

		var count = 0;

		var emitter = {
			emit: function(eventName, data) {
				count += 1;

				if (count == 1) assert.equal(data, expected1.toLowerCase());

				if (count > 1) {
					assert.equal(data, expected2.toLowerCase());
					console.log("2");
					callback();
				}
			}
		};

		func(emitter, new Buffer(testMessage1, "hex"));
		func(emitter, new Buffer(testMessage2, "hex"));
	});

	it("can assemble many fragments into a single message ", function(callback) {
		var expected = "AAAA0A0800015540C212";

		var testMessage1 = "AAAA";
		var testMessage2 = "0A08";
		var testMessage3 = "000155";
		var testMessage4 = "40C212";

		var func = parser.readline("AAAA");

		var emitter = {
			emit: function(eventName, data) {
				try {
					assert.equal(data, expected.toLowerCase());
					callback();
				} catch (err) {
					callback(err);
				}
			}
		};

		func(emitter, new Buffer(testMessage1, "hex"));
		func(emitter, new Buffer(testMessage2, "hex"));
		func(emitter, new Buffer(testMessage3, "hex"));
		func(emitter, new Buffer(testMessage4, "hex"));
	});
});
