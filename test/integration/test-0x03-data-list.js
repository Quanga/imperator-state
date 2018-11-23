const expect = require("expect.js");

describe("IBS - 651 data test", function() {
	this.timeout(10000);

	const ServerHelper = require("../helpers/server_helper");
	let serverHelper = new ServerHelper();

	const DatabaseHelper = require("../helpers/database_helper");
	let databaseHelper = new DatabaseHelper();

	const FileHelper = require("../helpers/file_helper");
	let fileHelper = new FileHelper();

	const SerialPortHelper = require("../helpers/serial_port_helper");
	let serialPortHelper = new SerialPortHelper();

	const PacketConstructor = require("../../lib/builders/packetConstructor");

	let timer = ms => {
		return new Promise(resolve => setTimeout(resolve, ms));
	};

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
		serverHelper.stopServer();
	});

	it.only("can process a data packet containing one ISC with IB651s 1, 2 & 3", async function() {
		let step1 = async () => {
			let data = { data: [0, 0, 0, 0, 0, 0, 0, 0] };
			let startMessage = new PacketConstructor(8, 12, data);
			await serialPortHelper.sendMessage(startMessage.packet);

			let data2 = {
				data: [1]
			};
			let pingMessage = new PacketConstructor(1, 12, data2);
			await serialPortHelper.sendMessage(pingMessage.packet);

			const data3 = {
				data: [1]
			};
			let initial = new PacketConstructor(2, 1, data3);
			await serialPortHelper.sendMessage(initial.packet);

			const data4 = {
				data: [1, 2, 3]
			};
			let initial2 = new PacketConstructor(2, 1, data4);
			await serialPortHelper.sendMessage(initial2.packet);

			const data5 = {
				data: [
					[0, 0, 0, 0, 0, 1, 0, 0],
					[0, 0, 0, 0, 0, 0, 1, 0],
					[0, 1, 0, 0, 0, 0, 0, 0],
					[1, 1, 1, 1, 1, 1, 1, 1]
				]
			};
			const finalmessage = new PacketConstructor(3, 1, data5);
			await serialPortHelper.sendMessage(finalmessage.packet);
		};

		let step2 = async () => {
			try {
				let result = await databaseHelper.getNodeTreeData(1, 1);

				if (result == null || result.length == 0)
					return new Error("Empty result!");

				var isc = null,
					ib651_1 = null,
					ib651_2 = null,
					ib651_3 = null;

				result.forEach(x => {
					if (parseInt(x["p.serial"]) == 1 && x["p.type_id"] == 1) isc = x;
					if (parseInt(x["c.serial"]) == 1 && x["c.type_id"] == 2) ib651_1 = x;
					if (parseInt(x["c.serial"]) == 2 && x["c.type_id"] == 2) ib651_2 = x;
					if (parseInt(x["c.serial"]) == 3 && x["c.type_id"] == 2) ib651_3 = x;
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

		let test = async () => {
			try {
				await timer(3500);
				await step1();
				await timer(600);
				let result = await step2();
				await step3(result);
			} catch (err) {
				return Promise.reject(err);
			}
		};

		return test();
	});

	it.only("will ignore a data list with no data", async function() {
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
