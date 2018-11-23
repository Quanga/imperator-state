const expect = require("expect.js");
require("dotenv").config({
	path: "./.env"
});

describe("CONTROL UNIT data tests", function() {
	this.timeout(20000);

	const ServerHelper = require("../helpers/server_helper");
	const serverHelper = new ServerHelper();

	const DatabaseHelper = require("../helpers/database_helper");
	const databaseHelper = new DatabaseHelper();

	const FileHelper = require("../helpers/file_helper");
	const fileHelper = new FileHelper();

	const SerialPortHelper = require("../helpers/serial_port_helper");
	const serialPortHelper = new SerialPortHelper();

	const PacketConstructor = require("../../lib/builders/packetConstructor");

	before("cleaning up queues", async () => {
		await fileHelper.clearQueueFiles();
	});

	before("cleaning up db", async () => {
		try {
			await databaseHelper.initialise();
			await databaseHelper.clearDatabase();
			await serverHelper.startServer();
		} catch (err) {
			return Promise.reject(err);
		}
	});

	after("stop test server", async () => {
		await serverHelper.stopServer();
	});

	let timer = ms => {
		return new Promise(resolve => setTimeout(resolve, ms));
	};

	it.only("can process key switch armed on IBC 8 where previous state was disarmed", async function() {
		let startTest = async () => {
			try {
				await timer(4500);
				const data = {
					data: [0, 0, 0, 0, 0, 0, 0, 0]
				};
				let initial = new PacketConstructor(8, 12, data);
				await serialPortHelper.sendMessage(initial.packet);

				const data2 = {
					data: [0, 0, 0, 0, 0, 0, 1, 1]
				};
				let message = new PacketConstructor(8, 12, data2);
				await serialPortHelper.sendMessage(message.packet);

				await timer(2000);
				let results = await checkDatabase();
				let ass = await checkResults(results);
				return ass;
			} catch (err) {
				return Promise.reject(err);
			}
		};

		let checkDatabase = async () => {
			try {
				let result = await databaseHelper.getNodeTreeData(12, 0);

				if (result == null || result.length == 0) {
					return new Error("Empty result!");
				}

				let ibc = result[0];
				return {
					ibc: ibc
				};
			} catch (err) {
				return Promise.reject(err);
			}
		};

		let checkResults = async result => {
			try {
				expect(result.ibc["p.communication_status"]).to.equal(1);
				expect(result.ibc["p.fire_button"]).to.equal(0);
				expect(result.ibc["p.key_switch_status"]).to.equal(1);
				expect(result.ibc["p.isolation_relay"]).to.equal(1);
			} catch (err) {
				return Promise.reject(err);
			}
		};

		await startTest();
	});

	it.only("can process a key switch disarmed on IBC 8 where previous state armed", async function() {
		let step1 = async () => {
			const data = {
				data: [0, 0, 0, 0, 0, 0, 1, 1]
			};
			let initial = new PacketConstructor(8, 8, data);
			await serialPortHelper.sendMessage(initial.packet);

			const data2 = {
				data: [0, 0, 0, 0, 0, 0, 1, 0]
			};
			let message2 = new PacketConstructor(8, 8, data2);
			await serialPortHelper.sendMessage(message2.packet);
		};

		let step2 = async () => {
			try {
				let result = await databaseHelper.getNodeTreeData(8, 0);

				if (result == null || result.length == 0) {
					return new Error("Empty result!");
				}

				let ibc = result[0];
				return { ibc: ibc };
			} catch (err) {
				return Promise.reject(err);
			}
		};

		let step3 = async result => {
			expect(result.ibc["p.communication_status"]).to.equal(1);
			expect(result.ibc["p.fire_button"]).to.equal(0);
			expect(result.ibc["p.key_switch_status"]).to.equal(0);
			expect(result.ibc["p.isolation_relay"]).to.equal(1);
		};

		let test = async () => {
			try {
				await timer(6500);

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
