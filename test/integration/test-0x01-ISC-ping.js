const expect = require("expect.js");
const DatabaseHelper = require("../helpers/database_helper");

describe("IBS - ISC list test", function() {
	const ServerHelper = require("../helpers/server_helper");
	const serverHelper = new ServerHelper();

	const FileHelper = require("../helpers/file_helper");
	const fileHelper = new FileHelper();

	const databaseHelper = new DatabaseHelper();

	const SerialPortHelper = require("../helpers/serial_port_helper");
	const serialPortHelper = new SerialPortHelper();

	const PacketConstructor = require("../../lib/builders/packetConstructor");

	this.timeout(30000);

	before("cleaning up queues", async function() {
		await fileHelper.clearQueueFiles();
	});

	before("cleaning up db", async function() {
		try {
			await databaseHelper.initialise();
			await databaseHelper.clearDatabase();
			await serverHelper.startServer();
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

	it.only("can process a packet with ISCs 1, 2 & 3, where no ISCs currently in database", async function() {
		let step1 = async function() {
			const data = {
				data: [1, 2, 3]
			};

			const message = new PacketConstructor(1, 1, data);
			await serialPortHelper.sendMessage(message.packet);
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
				return Promise.reject();
			}
		};

		let startTest = async function() {
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

		return startTest();
	});

	it.only("can process a packet containing ISCs 1, 2 & 3, where ISCs 1 & 2 are currently in database", async function() {
		let step1 = async function() {
			const data = {
				data: [1, 2]
			};

			const initial = new PacketConstructor(1, 1, data);
			await serialPortHelper.sendMessage(initial.packet);

			const data2 = {
				data: [1, 2, 3]
			};
			let message = new PacketConstructor(1, 1, data2);
			await serialPortHelper.sendMessage(message.packet);
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
				await timer(3500);
				await step1();
				await timer(2000);
				let result = await step2();
				await step4(result);
			} catch (err) {
				return Promise.reject(err);
			}
		};

		return startTest();
	});

	it.only("can process a packet containing ISCs 1, 2 & 3, where only ISC 4 is currently in database", async function() {
		let step1 = async () => {
			const data = {
				data: [4]
			};

			const initial = new PacketConstructor(1, 1, data);
			await serialPortHelper.sendMessage(initial.packet);

			const data2 = {
				data: [1, 2, 3]
			};

			const message = new PacketConstructor(1, 1, data2);
			await serialPortHelper.sendMessage(message.packet);
		};

		let step2 = async () => {
			let result = await databaseHelper.getNodeTreeData(1, 0);
			if (result == null || result.length == 0)
				return new Error("Empty result!");

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
				await timer(1500);
				let result = await step2();
				await step3(result);
			} catch (err) {
				return Promise.reject(err);
			}
		};

		return test();
	});
});
