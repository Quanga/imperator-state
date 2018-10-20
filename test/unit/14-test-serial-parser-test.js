/* eslint-disable no-new */

const sinon = require("sinon");
const assert = require("assert");

const AeceParser = require("../../lib/pipes/aece_readline");

describe("pipe-serialiport-pipe-tests", () => {
	it.only("emits data received after the ready data", () => {
		const spy = sinon.spy();
		const parser = new AeceParser({ delimiter: Buffer.from("AAAA", "hex") });

		parser.on("data", data => {
			spy(data);

			console.log(`data back - ${data.toString("hex")}`);
		});
		parser.write(Buffer.from("AAAA0e0100010001000200035455", "hex"));
		parser.write(Buffer.from("AAAA0e0100010001000200035422", "hex"));

		assert.deepEqual(
			spy.getCall(0).args[0],
			Buffer.from("aaaa0e0100010001000200035455")
		);
		assert.deepEqual(
			spy.getCall(1).args[0],
			Buffer.from("aaaa0e0100010001000200035422")
		);
		assert(spy.calledTwice);
	});

	it.only("emits the ready event before the data event", () => {
		const spy = sinon.spy();
		const parser = new AeceParser({ delimiter: Buffer.from("AAAA", "hex") });
		parser.on("ready", () => {
			parser.on("data", spy);
		});
		parser.write(Buffer.from("AAAA0e0100010001000200035455"));
		assert(spy.calledOnce);
	});

	it.only("allows receiving the delimiter over small writes", () => {
		const spy = sinon.spy();
		const parser = new AeceParser({ delimiter: Buffer.from("AAAA", "hex") });

		try {
			parser.on("data", data => {
				console.log("receiving back data - " + data.toString("hex"));
				spy(data);
			});
			parser.write(Buffer.from("AAAA0e01", "hex"));
			parser.write(Buffer.from("00010001", "hex"));
			parser.write(Buffer.from("000200", "hex"));
			parser.write(Buffer.from("035455", "hex"));

			assert.assertEquals(
				spy.getCall(0).args[0],
				Buffer.from("aaaa0e0100010001000200035455")
			);
			assert(spy.calledOnce);
		} catch (err) {
			//return Promise.reject(err);
		}
	});
});
