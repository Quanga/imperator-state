/* eslint-disable no-new */

const sinon = require("sinon");
var assert = require("assert");

const AeceParser = require("../../lib/pipes/aece_readline");

describe("AeceParser", () => {
	it("emits data received after the ready data", () => {
		const spy = sinon.spy();
		const parser = new AeceParser({
			delimiter: Buffer.from("AAAA", "hex")
		});

		parser.on("data", data => {
			console.log(data);
			spy(data);
		});
		parser.write(Buffer.from("AAAA0e0100010001000200035455", "hex"));
		parser.write(Buffer.from("AAAA0e0100010001000200035422", "hex"));

		assert.deepEqual(
			spy.getCall(0).args[0],
			Buffer.from("AAAA0e0100010001000200035455", "hex")
		);
		assert.deepEqual(
			spy.getCall(1).args[1],
			Buffer.from("AAAA0e0100010001000200035422", "hex")
		);
		assert(spy.calledTwice);
	});

	it("emits the ready event before the data event", () => {
		const spy = sinon.spy();
		const parser = new AeceParser({ delimiter: Buffer.from("AAAA", "hex") });
		parser.on("ready", () => {
			parser.on("data", spy);
		});
		parser.write(Buffer.from("AAAA0e0100010001000200035455"));
		assert(spy.calledOnce);
	});

	it("has a ready property", () => {
		const parser = new AeceParser({
			startDelimiter: Buffer.from("\n")
		});
		parser.resume();
		assert.isFalse(parser.ready);
		parser.write(Buffer.from("not the new line"));
		assert.isFalse(parser.ready);
		parser.write(Buffer.from("this is the \n"));
		assert.isTrue(parser.ready);
	});

	it("throws when not provided with a delimiter", () => {
		assert.throws(() => {
			new AeceParser();
		});
		assert.throws(() => {
			new AeceParser({});
		});
	});

	it("throws when called with a 0 length delimiter", () => {
		assert.throws(() => {
			new AeceParser({
				delimiter: Buffer.alloc(0)
			});
		});

		assert.throws(() => {
			new AeceParser({
				delimiter: ""
			});
		});

		assert.throws(() => {
			new AeceParser({
				delimiter: []
			});
		});
	});

	it("allows setting of the delimiter with a string", () => {
		new AeceParser({ delimiter: "string" });
	});

	it("allows setting of the delimiter with a buffer", () => {
		new AeceParser({ delimiter: Buffer.from([1]) });
	});

	it("allows setting of the delimiter with an array of bytes", () => {
		new AeceParser({ delimiter: [1] });
	});

	it("allows receiving the delimiter over small writes", () => {
		const spy = sinon.spy();
		const parser = new AeceParser({ delimiter: Buffer.from("AAAA", "hex") });

		parser.on("data", spy);
		parser.write(Buffer.from("AAAA0e01", "hex"));
		parser.write(Buffer.from("00010001", "hex"));
		parser.write(Buffer.from("000200", "hex"));
		parser.write(Buffer.from("035455", "hex"));

		assert.deepEqual(
			spy.getCall(0).args[0],
			Buffer.from("AAAA0e0100010001000200035455", "hex")
		);
		assert(spy.calledOnce);
	});
});
