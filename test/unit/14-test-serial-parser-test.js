/* eslint-disable no-new */

const sinon = require("sinon");
const assert = require("assert");

const AeceParser = require("../../lib/pipes/aece_readline");

let timer = ms => {
	return new Promise(resolve => setTimeout(resolve, ms));
};
describe("pipe-serialiport-pipe-tests", async () => {
	it.only("emits data received after the ready data", async () => {
		const spy = sinon.spy();
		const parser = new AeceParser({ delimiter: Buffer.from("AAAA", "hex") });

		try {
			parser.on("data", data => {
				spy(data);

				console.log(`data back - ${data.toString("hex")}`);
			});
			parser.write(Buffer.from("AAAA0e0100010001000200035455", "hex"));
			parser.write(Buffer.from("AAAA0e0100010001000200035422", "hex"));

			await timer(1);

			assert.deepEqual(
				spy.getCall(0).args[0],
				Buffer.from("aaaa0e0100010001000200035455", "hex")
			);
			assert.deepEqual(
				spy.getCall(1).args[0],
				Buffer.from("AAAA0e0100010001000200035422", "hex")
			);

			assert(spy.called);
		} catch (err) {
			return Promise.reject(err);
		}
	});

	it.only("emits the ready event before the data event", async () => {
		const spy = sinon.spy();
		const parser = new AeceParser({ delimiter: Buffer.from("AAAA", "hex") });
		try {
			parser.on("ready", () => {
				parser.on("data", spy);
			});

			parser.write(Buffer.from("AAAA0e0100010001000200035455", "hex"));
			await timer(10);

			assert(spy.calledOnce);
		} catch (err) {
			return Promise.reject(err);
		}
	});

	it.only("allows receiving the delimiter over small writes", async () => {
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

			await timer(10);
			assert.deepEqual(
				spy.getCall(0).args[0],
				Buffer.from("aaaa0e0100010001000200035455", "hex")
			);
			assert(spy.calledOnce);
		} catch (err) {
			return Promise.reject(err);
		}
	});

	it.only("allows splitting of large packets", async () => {
		const spy = sinon.spy();
		const parser = new AeceParser({ delimiter: Buffer.from("AAAA", "hex") });

		try {
			parser.on("data", data => {
				console.log("receiving back data - " + data.toString("hex"));
				spy(data);
			});
			parser.write(
				Buffer.from(
					"aaaa4805004364000a292e0194112f01f81130015c123101c01232012413330188133401ec13350150143601b4143701181538017c153901e0153a0144163b01a8163c010c17639daaaa4805004364000a293d0170173e01d4173f01381840019c1841010019420164194301c81944012c1a4501901a4601f41a4701581b4801bc1b4901201c4a01841c4b01e81cc563",
					"hex"
				)
			);

			await timer(1);

			assert.deepEqual(
				spy.getCall(0).args[0],
				Buffer.from(
					"aaaa4805004364000a292e0194112f01f81130015c123101c01232012413330188133401ec13350150143601b4143701181538017c153901e0153a0144163b01a8163c010c17639d",
					"hex"
				)
			);

			assert.deepEqual(
				spy.getCall(1).args[0],
				Buffer.from(
					"aaaa4805004364000a293d0170173e01d4173f01381840019c1841010019420164194301c81944012c1a4501901a4601f41a4701581b4801bc1b4901201c4a01841c4b01e81cc563",
					"hex"
				)
			);
			assert(spy.calledTwice);
		} catch (err) {
			return Promise.reject(err);
		}
	});

	it.only("dumps begining buffer if no ready", async () => {
		const spy = sinon.spy();
		const parser = new AeceParser({ delimiter: Buffer.from("AAAA", "hex") });

		try {
			parser.on("data", data => {
				console.log("receiving back data - " + data.toString("hex"));
				spy(data);
			});
			parser.write(
				Buffer.from(
					"3a0144163b01a8163c010c17639daaaa4805004364000a293d0170173e01d4173f01381840019c1841010019420164194301c81944012c1a4501901a4601f41a4701581b4801bc1b4901201c4a01841c4b01e81cc563",
					"hex"
				)
			);

			await timer(1);

			assert.deepEqual(
				spy.getCall(0).args[0],
				Buffer.from(
					"aaaa4805004364000a293d0170173e01d4173f01381840019c1841010019420164194301c81944012c1a4501901a4601f41a4701581b4801bc1b4901201c4a01841c4b01e81cc563",
					"hex"
				)
			);
			assert(spy.called);
		} catch (err) {
			return Promise.reject(err);
		}
	});

	it.only("dumps begining buffer if no ready in small chunks", async () => {
		const spy = sinon.spy();
		const parser = new AeceParser({ delimiter: Buffer.from("AAAA", "hex") });

		try {
			parser.on("data", data => {
				console.log("receiving back data - " + data.toString("hex"));
				spy(data);
			});
			parser.write(Buffer.from("3a01", "hex"));
			parser.write(Buffer.from("44163b01", "hex"));
			parser.write(Buffer.from("a8163c01", "hex"));
			parser.write(Buffer.from("0c", "hex"));

			parser.write(
				Buffer.from(
					"17639daaaa4805004364000a293d0170173e01d4173f01381840019c1841010019420164194301c81944012c1a4501901a4601f41a4701581b4801bc1b4901201c4a01841c4b01e81cc563",
					"hex"
				)
			);

			await timer(1);

			assert.deepEqual(
				spy.getCall(0).args[0],
				Buffer.from(
					"aaaa4805004364000a293d0170173e01d4173f01381840019c1841010019420164194301c81944012c1a4501901a4601f41a4701581b4801bc1b4901201c4a01841c4b01e81cc563",
					"hex"
				)
			);
			assert(spy.called);
		} catch (err) {
			return Promise.reject(err);
		}
	});

	it.only("can handle single byte buffer", async () => {
		const spy = sinon.spy();
		const parser = new AeceParser({ delimiter: Buffer.from("AAAA", "hex") });

		try {
			parser.on("data", data => {
				console.log("receiving back data - " + data.toString("hex"));
				spy(data);
			});

			parser.write(Buffer.from("aa", "hex"));

			parser.write(Buffer.from("aa", "hex"));

			parser.write(Buffer.from("48", "hex"));
			parser.write(Buffer.from("05", "hex"));

			parser.write(
				Buffer.from(
					"004364000a293d0170173e01d4173f01381840019c1841010019420164194301c81944012c1a4501901a4601f41a4701581b4801bc1b4901201c4a01841c4b01e81cc563",
					"hex"
				)
			);

			await timer(1);

			assert.deepEqual(
				spy.getCall(0).args[0],
				Buffer.from(
					"aaaa4805004364000a293d0170173e01d4173f01381840019c1841010019420164194301c81944012c1a4501901a4601f41a4701581b4801bc1b4901201c4a01841c4b01e81cc563",
					"hex"
				)
			);
			assert(spy.called);
		} catch (err) {
			return Promise.reject(err);
		}
	});

	it.only("can handle single byte buffer and dump data before delimiter", async () => {
		const spy = sinon.spy();
		const parser = new AeceParser({ delimiter: Buffer.from("AAAA", "hex") });

		try {
			parser.on("data", data => {
				console.log("receiving back data - " + data.toString("hex"));
				spy(data);
			});

			parser.write(Buffer.from("26", "hex"));
			parser.write(Buffer.from("aa", "hex"));
			parser.write(Buffer.from("aa", "hex"));
			parser.write(Buffer.from("48", "hex"));
			parser.write(Buffer.from("05", "hex"));

			parser.write(
				Buffer.from(
					"004364000a293d0170173e01d4173f01381840019c1841010019420164194301c81944012c1a4501901a4601f41a4701581b4801bc1b4901201c4a01841c4b01e81cc563",
					"hex"
				)
			);

			await timer(1);

			assert.deepEqual(
				spy.getCall(0).args[0],
				Buffer.from(
					"aaaa4805004364000a293d0170173e01d4173f01381840019c1841010019420164194301c81944012c1a4501901a4601f41a4701581b4801bc1b4901201c4a01841c4b01e81cc563",
					"hex"
				)
			);
			assert(spy.called);
		} catch (err) {
			return Promise.reject(err);
		}
	});

	it.only("can handle a in crc collision with aaaa delimiter - not complete", async () => {
		const spy = sinon.spy();
		const parser = new AeceParser({ delimiter: Buffer.from("AAAA", "hex") });

		try {
			parser.on("data", data => {
				console.log("receiving back data - " + data.toString("hex"));
				spy(data);
			});

			parser.write(Buffer.from("26", "hex"));
			parser.write(Buffer.from("aa", "hex"));
			parser.write(Buffer.from("aa", "hex"));
			parser.write(Buffer.from("48", "hex"));
			parser.write(Buffer.from("05", "hex"));
			parser.write(
				Buffer.from(
					"004364000a293d0170173e01d4173f01381840019c1841010019420164194301c81944012c1a4501901a4601f41a4701581b4801bc1b4901201c4a01841c4b01e81cc563",
					"hex"
				)
			);

			await timer(1);

			assert.deepEqual(
				spy.getCall(0).args[0],
				Buffer.from(
					"aaaa4805004364000a293d0170173e01d4173f01381840019c1841010019420164194301c81944012c1a4501901a4601f41a4701581b4801bc1b4901201c4a01841c4b01e81cc563",
					"hex"
				)
			);
			assert(spy.called);
		} catch (err) {
			return Promise.reject(err);
		}
	});
});
