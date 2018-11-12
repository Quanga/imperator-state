const expect = require("expect.js");

describe("ISC-ping-request-test", function() {
	const PacketBuilder = require("../../lib/builders/packet_builder");

	const ServerHelper = require("../helpers/server_helper");
	const serverHelper = new ServerHelper();

	const DatabaseHelper = require("../helpers/database_helper");
	const databaseHelper = new DatabaseHelper();

	const FileHelper = require("../helpers/file_helper");
	const fileHelper = new FileHelper();

	const SerialPortHelper = require("../helpers/serial_port_helper");
	const serialPortHelper = new SerialPortHelper();

	this.timeout(30000);

	before("cleaning up queues", async function() {
		await fileHelper.clearQueueFiles();
	});

	before("start test server", async function() {
		await serverHelper.startServer();
	});

	beforeEach("cleaning up db", async function() {
		try {
			await databaseHelper.clearDatabase();
		} catch (err) {
			return Promise.reject(err);
		}
	});

	after("stop test server", async function() {
		await serverHelper.stopServer();
	});

	let timer = ms => {
		return new Promise(resolve => setTimeout(resolve, ms));
	};

	it.only("can send a ping request containing ISCs 1, 2 & 3, where no ISCs currently in database", async function() {
		// AAAA0E010001000100020003(CRC)
		// start - AAAA
		// length - 0E
		// command - 01
		// serial - 0001
		// data - 000100020003 (serials 1, 2, 3)
		// crc - ?

		let step1 = async function() {
			let packetBuilder = new PacketBuilder();
			let message = packetBuilder
				.withStart("AAAA")
				.withCommand(1)
				.withSerial(1)
				.withSerialData(1)
				.withSerialData(2)
				.withSerialData(3)
				.build();

			await serialPortHelper.sendMessage(message);
		};

		let step2 = async function() {
			let result = await databaseHelper.getNodeTreeData(1, 0);
			if (result == null || result.length == 0)
				return new Error("Empty result!");

			let isc1 = null,
				isc2 = null,
				isc3 = null;

			result.forEach(x => {
				if (parseInt(x["c.serial"]) === 1 && x["c.type_id"] == 1) isc1 = x;
				if (parseInt(x["c.serial"]) === 2 && x["c.type_id"] == 1) isc2 = x;
				if (parseInt(x["c.serial"]) === 3 && x["c.type_id"] == 1) isc3 = x;
			});

			return { isc1: isc1, isc2: isc2, isc3: isc3 };
		};

		let step3 = async function(result) {
			try {
				expect(result.isc1["c.communication_status"]).to.equal(1); // communication status
				expect(result.isc2["c.communication_status"]).to.equal(1);
				expect(result.isc3["c.communication_status"]).to.equal(1);
			} catch (err) {
				console.log(err);
				return Promise.reject();
			}
		};

		let startTest = async function() {
			try {
				console.log("STARTING TESTS<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<");
				await timer(3500);
				console.log("SENDING<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<");
				await step1();
				await timer(4000);
				let result = await step2();
				await step3(result);
			} catch (err) {
				return Promise.reject();
			}
		};

		return startTest();
	});

	it.only("can send a ping request containing ISCs 1, 2 & 3, where ISCs 1 & 2 are currently in database", async function() {
		/* INITIAL STATE: AAAA0E01000100010002(CRC)
         start - AAAA
         length - 0E
         command - 01
         serial - 0001
         data - 00010002 (serials 1, 2)
         crc - ?
         */

		/* TEST: AAAA0E010001000100020003(CRC)
         start - AAAA
         length - 0E
         command - 01
         serial - 0001
         data - 000100020003 (serials 1, 2, 3)
         crc - ?
         */
		let packetBuilder = new PacketBuilder();

		let step1 = async function() {
			let initial = packetBuilder
				.withStart("AAAA")
				.withCommand(1)
				.withSerial(1)
				.withSerialData(1)
				.withSerialData(2)
				.build();

			await serialPortHelper.sendMessage(initial);
			console.log("SENDING 1<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<", initial);

			let message = packetBuilder.withSerialData(3).build();

			await timer(1000);

			await serialPortHelper.sendMessage(message);
			console.log("SENDING 2<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<", message);
		};

		let step2 = async function() {
			let dbresult = await databaseHelper.getNodeTreeData(1, 0);

			if (dbresult == null || dbresult.length == 0)
				return new Error("Empty dbresult!");

			let isc1 = null,
				isc2 = null,
				isc3 = null;

			dbresult.forEach(x => {
				if (x["c.serial"] == 1 && x["c.type_id"] == 1) isc1 = x;
				if (x["c.serial"] == 2 && x["c.type_id"] == 1) isc2 = x;
				if (x["c.serial"] == 3 && x["c.type_id"] == 1) isc3 = x;
			});
			console.log(dbresult);
			return { isc1: isc1, isc2: isc2, isc3: isc3 };
		};

		let step4 = async function(result) {
			try {
				expect(result.isc1["c.communication_status"]).to.equal(1);
				expect(result.isc2["c.communication_status"]).to.equal(1);
				expect(result.isc3["c.communication_status"]).to.equal(1);
			} catch (err) {
				return Promise.reject(err);
			}
		};

		let startTest = async function() {
			try {
				console.log("STARTING TESTS<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<");
				await timer(5500);
				await step1();
				await timer(4000);
				let result = await step2();

				await step4(result);
			} catch (err) {
				return Promise.reject(err);
			}
		};

		return startTest();
	});

	it.only("can send a ping request containing ISCs 1, 2 & 3, where only ISC 4 is currently in database", async function() {
		var packetBuilder = new PacketBuilder();

		let step1 = async () => {
			/* INITIAL STATE: AAAA0E0100010004(CRC)
			 start - AAAA
			 length - 0E
			 command - 01
			 serial - 0001
			 data - 0004 (serial 4)
			 crc - ?
			 */

			let initial = packetBuilder
				.withStart("AAAA")
				.withCommand(1)
				.withSerial(1)
				.withSerialData(4)
				.build();

			//console.log("## INITIAL: " + initial);

			await serialPortHelper.sendMessage(initial);

			await timer(1000);
			packetBuilder.reset();

			/* TEST: AAAA0E010001000100020003(CRC)
                 start - AAAA
                 length - 0E
                 command - 01
                 serial - 0001
                 data - 000100020003 (serials 1, 2, 3)
                 crc - ?
                 */
			let message = packetBuilder
				.withStart("AAAA")
				.withCommand(1)
				.withSerial(1)
				.withSerialData(1)
				.withSerialData(2)
				.withSerialData(3)
				.build();

			await serialPortHelper.sendMessage(message);
		};

		let step2 = async () => {
			let result = await databaseHelper.getNodeTreeData(1, 0);
			if (result == null || result.length == 0)
				return new Error("Empty result!");

			//console.log("### NODE TREE RESULT: " + JSON.stringify(result));

			var isc1 = null,
				isc2 = null,
				isc3 = null,
				isc4 = null;

			result.forEach(x => {
				if (x["c.serial"] == 1 && x["c.type_id"] == 1) isc1 = x;

				if (x["c.serial"] == 2 && x["c.type_id"] == 1) isc2 = x;

				if (x["c.serial"] == 3 && x["c.type_id"] == 1) isc3 = x;

				if (x["c.serial"] == 4 && x["c.type_id"] == 1) isc4 = x;
			});
			return { isc1: isc1, isc2: isc2, isc3: isc3, isc4: isc4 };
		};

		let step3 = async result => {
			//check communication status on each
			try {
				expect(result.isc1["c.communication_status"]).to.equal(1);
				expect(result.isc2["c.communication_status"]).to.equal(1);
				expect(result.isc3["c.communication_status"]).to.equal(1);
				expect(result.isc4["c.communication_status"]).to.equal(1);
			} catch (err) {
				return Promise.reject(err);
			}
		};

		let test = async () => {
			try {
				await timer(4000);

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
