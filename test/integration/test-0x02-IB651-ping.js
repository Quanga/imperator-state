/**
 * Created by grant on 2016/11/29.
 */

var expect = require("expect.js");

describe("IB651-ping-request-test", function() {
	var ServerHelper = require("../helpers/server_helper");
	var serverHelper = new ServerHelper();

	var DatabaseHelper = require("../helpers/database_helper");
	var databaseHelper = new DatabaseHelper();

	var FileHelper = require("../helpers/file_helper");
	var fileHelper = new FileHelper();

	var SerialPortHelper = require("../helpers/serial_port_helper");
	var serialPortHelper = new SerialPortHelper();

	this.timeout(30000);

	var PacketBuilder = require("../../lib/builders/packet_builder");

	before("cleaning up queues", async function() {
		await fileHelper.clearQueueFiles();
	});

	before("start test server", async function() {
		await serverHelper.startServer();
	});

	beforeEach("cleaning up db", async function() {
		await databaseHelper.clearDatabase();
	});

	after("stop test server", async function() {
		await serverHelper.stopServer();
	});

	let timer = ms => {
		return new Promise(resolve => setTimeout(resolve, ms));
	};

	it.only("can send a ping request containing IB651s 1, 2 & 3, where no IB651s currently in database", async function() {
		// AAAA0E020001000100020003(CRC)
		// start - AAAA
		// length - 0E
		// command - 02
		// serial - 0001
		// data - 000100020003 (serials 1, 2, 3)
		// crc - ?

		let step1 = async () => {
			var packetBuilder = new PacketBuilder();
			var message = packetBuilder
				.withStart("AAAA")
				.withCommand(1)
				.withSerial(1)
				.withSerialData(1)
				.build();

			console.log("## INITIAL MESSAGE: " + message);

			await serialPortHelper.sendMessage(message);
			await timer(2000);
			packetBuilder.reset();

			// now send an ISC ping with 3 IB651's
			let messageb = packetBuilder
				.withStart("AAAA")
				.withCommand(2)
				.withSerial(1)
				.withSerialData(256)
				.withSerialData(512)
				.withSerialData(768)
				.build();

			await serialPortHelper.sendMessage(messageb);
		};

		let step2 = async () => {
			let result = await databaseHelper.getNodeTreeData(1, 1);
			if (result == null || result.length == 0)
				return new Error("Empty result!");

			let ib651_1 = null,
				ib651_2 = null,
				ib651_3 = null;

			result.forEach(x => {
				if (parseInt(x["c.serial"]) == 1 && x["c.type_id"] == 2) ib651_1 = x;
				if (parseInt(x["c.serial"]) == 2 && x["c.type_id"] == 2) ib651_2 = x;
				if (parseInt(x["c.serial"]) == 3 && x["c.type_id"] == 2) ib651_3 = x;
			});
			//console.log(result);
			return {
				ib651_1: ib651_1,
				ib651_2: ib651_2,
				ib651_3: ib651_3
			};
		};

		let step3 = async result => {
			try {
				//check communication status on each
				expect(result.ib651_1["c.communication_status"]).to.equal(1);
				expect(result.ib651_1["c.window_id"]).to.equal(1);

				expect(result.ib651_2["c.communication_status"]).to.equal(1);
				expect(result.ib651_2["c.window_id"]).to.equal(2);

				expect(result.ib651_3["c.communication_status"]).to.equal(1);
				expect(result.ib651_3["c.window_id"]).to.equal(3);
			} catch (err) {
				return Promise.reject(err);
			}
		};

		let test = async () => {
			try {
				await timer(7500);
				await step1();
				await timer(3000);
				let result = await step2();
				await step3(result);
			} catch (err) {
				return Promise.reject(err);
			}
		};
		return test();
	});

	it.only("can send a ping request containing IB651s 1, 2 & 3, where IB651s 1 & 2 are currently in database", async function() {
		/* INITIAL STATE: AAAA0E02000100010002(CRC)
					 start - AAAA
					 length - 0E
					 command - 02
					 serial - 0001
					 data - 00010002 (serials 1, 2)
					 crc - ?
					 */

		/* TEST: AAAA0E020001000100020003(CRC)
			 start - AAAA
			 length - 0E
			 command - 02
			 serial - 0001
			 data - 000100020003 (serials 1, 2, 3)
			 crc - ?
			 */

		let step1 = async () => {
			let packetBuilder = new PacketBuilder();

			// set up the initial IBC and single ISC via an ISC ping

			let messagea = packetBuilder
				.withStart("AAAA")
				.withCommand(1)
				.withSerial(1)
				.withSerialData(1)
				.build();

			await serialPortHelper.sendMessage(messagea);

			packetBuilder.reset();

			let initial = packetBuilder
				.withStart("AAAA")
				.withCommand(2)
				.withSerial(1)
				.withSerialData(256)
				.withSerialData(512)
				.build();

			await serialPortHelper.sendMessage(initial);

			packetBuilder.reset();

			let messageb = packetBuilder
				.withStart("AAAA")
				.withCommand(2)
				.withSerial(1)
				.withSerialData(256)
				.withSerialData(512)
				.withSerialData(768)
				.build();

			await serialPortHelper.sendMessage(messageb);
		};

		let step2 = async () => {
			let result = await databaseHelper.getNodeTreeData(1, 1);
			if (result == null || result.length == 0)
				return new Error("Empty result!");

			var ib651_1 = null,
				ib651_2 = null,
				ib651_3 = null;

			result.forEach(x => {
				if (parseInt(x["c.serial"]) == 1 && x["c.type_id"] == 2) ib651_1 = x;
				if (parseInt(x["c.serial"]) == 2 && x["c.type_id"] == 2) ib651_2 = x;
				if (parseInt(x["c.serial"]) == 3 && x["c.type_id"] == 2) ib651_3 = x;
			});

			return {
				ib651_1: ib651_1,
				ib651_2: ib651_2,
				ib651_3: ib651_3
			};
		};

		let step3 = async result => {
			try {
				expect(result.ib651_1["c.communication_status"]).to.equal(1);
				expect(result.ib651_1["c.window_id"]).to.equal(1);

				expect(result.ib651_2["c.communication_status"]).to.equal(1);
				expect(result.ib651_2["c.window_id"]).to.equal(2);

				expect(result.ib651_3["c.communication_status"]).to.equal(1);
				expect(result.ib651_3["c.window_id"]).to.equal(3);
			} catch (err) {
				return Promise.reject(err);
			}
		};

		let test = async () => {
			try {
				await timer(3500);
				await step1();
				await timer(2000);
				let results = await step2();
				await step3(results);
			} catch (err) {
				return Promise.reject(err);
			}
		};

		return test();
	});

	it.only("can send a ping request containing IB651s 1, 2 & 3, where only IB651 4 is currently in database", async function() {
		let step1 = async () => {
			let packetBuilder = new PacketBuilder();

			// set up the initial IBC and single ISC via an ISC ping
			let message = packetBuilder
				.withStart("AAAA")
				.withCommand(1)
				.withSerial(1)
				.withSerialData(1)
				.build();

			await serialPortHelper.sendMessage(message);

			await timer(1000);
			packetBuilder.reset();

			/* INITIAL STATE: AAAA0E0200010004(CRC)
			 start - AAAA
			 length - 0E
			 command - 02
			 serial - 0001
			 data - 0004 (serial 4)
			 crc - ?
			 */

			let initial = packetBuilder
				.withStart("AAAA")
				.withCommand(2)
				.withSerial(1)
				.withSerialData(1024)
				.build();

			await serialPortHelper.sendMessage(initial);
			await timer(1000);

			packetBuilder.reset();

			/* TEST: AAAA0E020001000100020003(CRC)
		 start - AAAA
		 length - 0E
		 command - 02
		 serial - 0001
		 data - 000100020003 (serials 1, 2, 3)
		 crc - ?
		 */

			let messageb = packetBuilder
				.withStart("AAAA")
				.withCommand(2)
				.withSerial(1)
				.withSerialData(256)
				.withSerialData(512)
				.withSerialData(768)
				.build();

			await serialPortHelper.sendMessage(messageb);
		};

		let step2 = async () => {
			let result = await databaseHelper.getNodeTreeData(1, 1); // get node data for ISC serial 1
			if (result == null || result.length == 0)
				return new Error("Empty result!");

			var ib651_1 = null,
				ib651_2 = null,
				ib651_3 = null,
				ib651_4 = null;

			result.forEach(x => {
				if (parseInt(x["c.serial"]) == 1 && x["c.type_id"] == 2) ib651_1 = x;

				if (parseInt(x["c.serial"]) == 2 && x["c.type_id"] == 2) ib651_2 = x;

				if (parseInt(x["c.serial"]) == 3 && x["c.type_id"] == 2) ib651_3 = x;

				if (parseInt(x["c.serial"]) == 4 && x["c.type_id"] == 2) ib651_4 = x;
			});

			return {
				ib651_1: ib651_1,
				ib651_2: ib651_2,
				ib651_3: ib651_3,
				ib651_4: ib651_4
			};
		};

		let step3 = async result => {
			try {
				expect(result.ib651_1["c.communication_status"]).to.equal(1);
				expect(result.ib651_1["c.parent_id"]).to.equal(result.ib651_1["p.id"]);
				expect(result.ib651_1["c.window_id"]).to.equal(1);

				expect(result.ib651_2["c.communication_status"]).to.equal(1);
				expect(result.ib651_2["c.parent_id"]).to.equal(result.ib651_2["p.id"]);
				expect(result.ib651_2["c.window_id"]).to.equal(2);

				expect(result.ib651_3["c.communication_status"]).to.equal(1);
				expect(result.ib651_3["c.parent_id"]).to.equal(result.ib651_3["p.id"]);
				expect(result.ib651_3["c.window_id"]).to.equal(3);

				expect(result.ib651_4["c.communication_status"]).to.equal(0);
				expect(result.ib651_4["c.parent_id"]).to.equal(result.ib651_4["p.id"]);
				expect(result.ib651_4["c.window_id"]).to.equal(0);
			} catch (err) {
				return Promise.reject(err);
			}
		};

		let test = async () => {
			try {
				await timer(4500);
				await step1();
				await timer(5000);
				let result = await step2();
				await step3(result);
			} catch (err) {
				return Promise.reject(err);
			}
		};
		return test();
	});

	it.only("can send a ping request that changes the ordering of window ids of existing IB651s in database", async function() {
		let step1 = async () => {
			var packetBuilder = new PacketBuilder();

			// set up the initial IBC and single ISC via an ISC ping
			let message = packetBuilder
				.withStart("AAAA")
				.withCommand(1)
				.withSerial(1)
				.withSerialData(1)
				.build();

			await serialPortHelper.sendMessage(message);

			packetBuilder.reset();
			/* INITIAL STATE: AAAA0E0200010002(CRC)
						 start - AAAA
						 length - 0E
						 command - 02
						 serial - 0001
						 data - 00010002 (serials 1 & 2)
						 crc - ?
						 */

			let initial = packetBuilder
				.withStart("AAAA")
				.withCommand(2)
				.withSerial(1)
				.withSerialData(256)
				.withSerialData(512)
				.build();

			await serialPortHelper.sendMessage(initial);

			packetBuilder.reset();

			/* TEST: AAAA0E020001000200010003(CRC)
                 start - AAAA
                 length - 0E
                 command - 02
                 serial - 0001
                 data - 000200010003 (serials 2, 1, 3)
                 crc - ?
                 */

			let messageb = packetBuilder
				.withStart("AAAA")
				.withCommand(2)
				.withSerial(1)
				.withSerialData(512)
				.withSerialData(256)
				.withSerialData(768)
				.build();
			//await timer(1500);
			await serialPortHelper.sendMessage(messageb);
		};

		let step2 = async () => {
			let result = await databaseHelper.getNodeTreeData(1, 1);
			if (result == null || result.length == 0)
				return new Error("Empty result!");

			var ib651_1 = null,
				ib651_2 = null,
				ib651_3 = null;

			result.forEach(x => {
				if (x["c.serial"] == 2 && x["c.type_id"] == 2) ib651_2 = x;

				if (x["c.serial"] == 1 && x["c.type_id"] == 2) ib651_1 = x;

				if (x["c.serial"] == 3 && x["c.type_id"] == 2) ib651_3 = x;
			});

			return {
				ib651_1: ib651_1,
				ib651_2: ib651_2,
				ib651_3: ib651_3
			};
		};

		let step3 = async result => {
			try {
				expect(result.ib651_2["c.window_id"]).to.equal(1);
				expect(result.ib651_1["c.window_id"]).to.equal(2);
				expect(result.ib651_3["c.window_id"]).to.equal(3);
			} catch (err) {
				console.log(err);
				return Promise.reject(err);
			}
		};

		let test = async () => {
			try {
				await timer(3500);
				await step1();
				await timer(2000);
				let result = await step2();
				await step3(result);
			} catch (err) {
				return Promise.reject(err);
			}
		};

		return test();
	});
});
