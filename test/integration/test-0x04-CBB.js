const expect = require("expect.js");
const DatabaseHelper = require("../helpers/database_helper");

describe("AXXIS - CBB list test", function() {
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

	it.only("can process a packet with CBBs 1 where no CBBs currently in database", async function() {
		let step1 = async function() {
			const data1 = {
				data: [0, 0, 0, 0, 0, 0, 0, 1]
			};

			let initial = new PacketConstructor(8, 8, data1);
			await serialPortHelper.sendMessage(initial.packet);

			await timer(3000);
			const data2 = { data: [] };

			const message = new PacketConstructor(4, 12, data2);
			await serialPortHelper.sendMessage(message.packet);
		};

		let step2 = async function() {
			let result = await databaseHelper.getNodeTreeData(8, 0);
			if (result == null || result.length == 0)
				return new Error("Empty result!");

			let cbb = null;

			result.forEach(x => {
				if (parseInt(x["c.serial"]) === 12 && x["c.type_id"] === 3) cbb = x;
			});

			return { cbb: cbb };
		};

		let step3 = async function(result) {
			try {
				expect(result.cbb["c.communication_status"]).to.equal(1); // communication status
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
				await step3(result);
			} catch (err) {
				return Promise.reject(err);
			}
		};

		return startTest();
	});

	it.only("can process a packet with CBBs 1 and 2 EDDs where no CBBs currently in database", async function() {
		let step1 = async function() {
			const data1 = {
				data: [0, 0, 0, 0, 0, 0, 0, 1]
			};

			let initial = new PacketConstructor(8, 8, data1);
			await serialPortHelper.sendMessage(initial.packet);

			await timer(3000);
			const data2 = {
				data: [
					{ serial: 4423423, window_id: 33 },
					{ serial: 4523434, window_id: 34 }
				]
			};

			const message = new PacketConstructor(4, 12, data2);
			await serialPortHelper.sendMessage(message.packet);
		};

		let step2 = async function() {
			let result = await databaseHelper.getNodeTreeData(8, 0);
			if (result == null || result.length == 0)
				return new Error("Empty result!");

			let cbb = null,
				edd1 = null,
				edd2 = null;

			result.forEach(x => {
				if (parseInt(x["c.serial"]) === 12 && x["c.type_id"] === 3) cbb = x;
				if (parseInt(x["g.serial"]) === 4423423 && x["g.type_id"] === 4)
					edd1 = x;
				if (parseInt(x["g.serial"]) === 4523434 && x["g.type_id"] === 4)
					edd2 = x;
			});
			//console.log(result);

			return { cbb: cbb, edd1: edd1, edd2: edd2 };
		};

		let step3 = async function(result) {
			try {
				expect(result.cbb["c.communication_status"]).to.equal(1); // communication status
				expect(result.edd1["g.detonator_status"]).to.equal(null); // det status
				expect(result.edd2["g.detonator_status"]).to.equal(null); // det status
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
				await step3(result);
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
