

describe("IBS - 651 data test", async function () {
	this.timeout(20000);

	const expect = require("expect.js");
	const RequestHelper = require("../../helpers/request_helper");

	const ServerHelper = require("../../helpers/server_helper");
	let serverHelper = new ServerHelper();

	const DatabaseHelper = require("../../helpers/database_helper");
	let databaseHelper = new DatabaseHelper();

	const SerialPortHelper = require("../../helpers/serial_port_helper");
	let serialPortHelper = new SerialPortHelper();

	const PacketConstructor = require("../../../lib/builders/packetConstructor");


	let timer = ms => {
		return new Promise(resolve => setTimeout(resolve, ms));
	};

	beforeEach("cleaning up db and start server", async function () {
		try {
			await databaseHelper.initialise();
			await databaseHelper.clearDatabase();
			console.log("DATA CLEARD");
			await serialPortHelper.initialise();

			serverHelper = new ServerHelper();
			await serverHelper.startServer();
		} catch (err) {
			return Promise.reject(err);
		}
	});

	afterEach("stop test server", async function () {
		await serverHelper.stopServer();
	});

	it.only("can process a data packet containing one ISC with IB651s 1, 2 & 3", async function () {
		let step1 = async () => {
			let startMessage = new PacketConstructor(8, 12, {
				data: [0, 0, 0, 0, 0, 0, 0, 0]
			}).packet;
			await serialPortHelper.sendMessage(startMessage);

			let pingMessage = new PacketConstructor(1, 12, {
				data: [27]
			}).packet;
			await serialPortHelper.sendMessage(pingMessage);

			await timer(2000);

			let initial = new PacketConstructor(2, 27, {
				data: [33]
			}).packet;
			await serialPortHelper.sendMessage(initial);

			await timer(2000);

			let initial2 = new PacketConstructor(2, 27, {
				data: [33, 34, 35]
			}).packet;
			await serialPortHelper.sendMessage(initial2);

			await timer(3000);
			const finalmessage = new PacketConstructor(3, 27, {
				data: [
					[0, 0, 0, 0, 0, 1, 0, 0],
					[0, 0, 0, 0, 0, 0, 1, 0],
					[0, 1, 0, 0, 0, 0, 0, 0],
					[1, 1, 1, 1, 1, 1, 1, 1]
				]
			}).packet;
			await serialPortHelper.sendMessage(finalmessage);

			await timer(1000);
			let blast = new PacketConstructor(8, 12, {
				data: [0, 0, 0, 0, 0, 0, 0, 1]
			}).packet;
			await serialPortHelper.sendMessage(blast);
		};

		let step2 = async () => {
			try {
				let result = await databaseHelper.getNodeTreeData(27, 1);

				if (result == null || result.length == 0)
					return new Error("Empty result!");

				var isc = null,
					ib651_1 = null,
					ib651_2 = null,
					ib651_3 = null;

				result.forEach(x => {
					if (parseInt(x["p.serial"]) == 27 && x["p.type_id"] == 1) isc = x;
					if (parseInt(x["c.serial"]) == 33 && x["c.type_id"] == 2) ib651_1 = x;
					if (parseInt(x["c.serial"]) == 34 && x["c.type_id"] == 2) ib651_2 = x;
					if (parseInt(x["c.serial"]) == 35 && x["c.type_id"] == 2) ib651_3 = x;
				});

				return {
					isc: isc,
					ib651_1: ib651_1,
					ib651_2: ib651_2,
					ib651_3: ib651_3
				};
			} catch (err) {
				return Promise.reject(err);
			}
		};

		let step3 = async result => {
			try {
				//check communication status on each
				expect(result.isc["p.communication_status"]).to.equal(1);
				expect(result.ib651_1["c.communication_status"]).to.equal(1);

				expect(result.ib651_1["c.window_id"]).to.equal(1);
				expect(result.ib651_2["c.communication_status"]).to.equal(1);

				expect(result.ib651_2["c.window_id"]).to.equal(2);
				expect(result.ib651_3["c.communication_status"]).to.equal(1);

				expect(result.ib651_3["c.window_id"]).to.equal(3);
				expect(result.ib651_3["c.communication_status"]).to.equal(1);
			} catch (err) {
				return Promise.reject(err);
			}
		};
		let step2a = async function () {
			try {
				let requestHelper = new RequestHelper();
				let result = await requestHelper.getAll();
				return result;
			} catch (err) {
				return Promise.reject(err);
			}
		};

		let step2b = async function () {
			try {
				let requestHelper = new RequestHelper();
				let result = await requestHelper.getBlastModel();

				return result;
			} catch (err) {
				return Promise.reject(err);
			}
		};

		let test = async () => {
			try {
				await timer(3500);
				await step1();
				await timer(3000);
				let result = await step2();
				console.log(JSON.stringify(await step2a()));
				console.log(JSON.stringify(await step2b()));

				await step3(result);
			} catch (err) {
				return Promise.reject(err);
			}
		};

		return test();
	});

	it.only("will ignore a data list with no data", async function () {
		let step1 = async () => {
			var initial = "aaaa080300011ae3";

			await serialPortHelper.sendMessage(initial);
		};

		let step2 = async () => {
			let results = await databaseHelper.getNodeTreeData(1, 1);
			return results;
		};

		let test = async () => {
			try {
				await timer(3500);

				await step1();
				await timer(1500);

				let result = await step2();
				expect(result.length).to.equal(0);
			} catch (err) {
				return Promise.reject(err);
			}
		};

		return test();
	});
});
