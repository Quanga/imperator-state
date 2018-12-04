var expect = require("expect.js");
const RequestHelper = require("../helpers/request_helper");

describe("IBS - 651 list test", function() {
	this.timeout(10000);

	var ServerHelper = require("../helpers/server_helper");
	var serverHelper = new ServerHelper();

	var DatabaseHelper = require("../helpers/database_helper");
	var databaseHelper = new DatabaseHelper();

	var FileHelper = require("../helpers/file_helper");
	var fileHelper = new FileHelper();

	var SerialPortHelper = require("../helpers/serial_port_helper");
	var serialPortHelper = new SerialPortHelper();

	const PacketConstructor = require("../../lib/builders/packetConstructor");

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

	it.only("can process a packet containing IB651s 1, 2 & 3, where no IB651s currently in database", async function() {
		let step1 = async () => {
			const message = new PacketConstructor(1, 1, {
				data: [1]
			}).packet;
			await serialPortHelper.sendMessage(message);

			const messageb = new PacketConstructor(2, 1, {
				data: [1, 2, 3]
			}).packet;
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
				await timer(4500);
				await step1();
				await timer(2000);
				let result = await step2();
				await step3(result);

				let requestHelper = new RequestHelper();
				let fin = await requestHelper.getAll();
				console.log(JSON.stringify(fin));

				let requestHelper2 = new RequestHelper();
				let fin2 = await requestHelper2.getBlastModel();
				console.log(JSON.stringify(fin2));
			} catch (err) {
				return Promise.reject(err);
			}
		};
		return test();
	});

	it.only("can process a packet containing IB651s 1, 2 & 3, where IB651s 1 & 2 are currently in database", async function() {
		let step1 = async () => {
			const message = new PacketConstructor(1, 1, {
				data: [1]
			}).packet;
			await serialPortHelper.sendMessage(message);

			const messageb = new PacketConstructor(2, 1, {
				data: [1, 2]
			}).packet;
			await serialPortHelper.sendMessage(messageb);

			const messagec = new PacketConstructor(2, 1, {
				data: [1, 2, 3]
			}).packet;
			await serialPortHelper.sendMessage(messagec);
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

				let requestHelper = new RequestHelper();
				let fin = await requestHelper.getAll();
				console.log(JSON.stringify(fin));

				let requestHelper2 = new RequestHelper();
				let fin2 = await requestHelper2.getBlastModel();
				console.log(JSON.stringify(fin2));
			} catch (err) {
				return Promise.reject(err);
			}
		};

		return test();
	});

	it.only("can process a packet containing IB651s 1, 2 & 3, where only IB651 4 is currently in database", async function() {
		let step1 = async () => {
			const message = new PacketConstructor(1, 1, {
				data: [1]
			}).packet;
			await serialPortHelper.sendMessage(message);

			const messageb = new PacketConstructor(2, 1, {
				data: [4]
			}).packet;
			await serialPortHelper.sendMessage(messageb);

			const messagec = new PacketConstructor(2, 1, {
				data: [1, 2, 3]
			}).packet;
			await serialPortHelper.sendMessage(messagec);
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
				await timer(2000);
				let result = await step2();
				await step3(result);
			} catch (err) {
				return Promise.reject(err);
			}
		};
		return test();
	});

	it.only("can process a packet that changes the ordering of window ids of existing IB651s in database", async function() {
		let step1 = async () => {
			const message = new PacketConstructor(1, 1, {
				data: [1]
			}).packet;
			await serialPortHelper.sendMessage(message);

			const messageb = new PacketConstructor(2, 1, {
				data: [1, 2, 3]
			}).packet;
			await serialPortHelper.sendMessage(messageb);

			const messagec = new PacketConstructor(2, 1, {
				data: [2, 1, 3]
			}).packet;
			await serialPortHelper.sendMessage(messagec);

			//await serialPortHelper.sendMessage(messageb);
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
				return Promise.reject(err);
			}
		};

		let test = async () => {
			try {
				await timer(3500);
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
});
