const expect = require("expect.js");
var Mesh = require("happner-2");
const ServerHelper = require("../../helpers/server_helper");
const SerialPortHelper = require("../../helpers/serial_port_helper");
const PacketConstructor = require("../../../lib/builders/packetConstructor");
const RequestHelper = require("../../helpers/request_helper");

describe("IBS - 651 list test", function() {
	this.timeout(30000);
	let serverHelper = new ServerHelper();
	const serialPortHelper = new SerialPortHelper();

	let client = null;

	const AsyncLogin = () =>
		new Promise((resolve, reject) => {
			client = new Mesh.MeshClient({
				secure: true,
				port: 55000
			});

			client.on("login/allow", () => resolve());
			client.on("login/deny", () => reject());
			client.on("login/error", () => reject());
			client.login({
				username: "_ADMIN",
				password: "happn"
			});
		});

	before("cleaning up db", async function() {
		try {
			await serialPortHelper.initialise();
			await serverHelper.startServer();
			await AsyncLogin();
		} catch (err) {
			return Promise.reject(err);
		}
	});

	beforeEach("delete all current nodes", async function() {
		client.exchange.nodeRepository.deleteAll();
	});

	after("stop test server", async function() {
		client.disconnect();
		await serverHelper.stopServer();
		await serialPortHelper.destroy();
	});

	let timer = ms => {
		return new Promise(resolve => setTimeout(resolve, ms));
	};

	it("can process a packet containing IB651s 1, 2 & 3, where no IB651s currently in database", async function() {
		let sendMessages = async () => {
			const message = new PacketConstructor(1, 1, {
				data: [1]
			}).packet;
			await serialPortHelper.sendMessage(message);

			const messageb = new PacketConstructor(2, 1, {
				data: [1, 2, 3]
			}).packet;
			await serialPortHelper.sendMessage(messageb);
		};

		let getResults = async () => {
			let result = await client.exchange.nodeRepository.getAllNodes();

			if (result == null || result.length == 0)
				throw new Error("Empty result!");

			let ib651_1 = null,
				ib651_2 = null,
				ib651_3 = null;

			result.forEach(x => {
				if (parseInt(x.data.serial) == 1 && x.data.typeId == 2) ib651_1 = x;
				if (parseInt(x.data.serial) == 2 && x.data.typeId == 2) ib651_2 = x;
				if (parseInt(x.data.serial) == 3 && x.data.typeId == 2) ib651_3 = x;
			});

			expect(ib651_1.data.communicationStatus).to.equal(1);
			expect(ib651_1.data.windowId).to.equal(1);

			expect(ib651_2.data.communicationStatus).to.equal(1);
			expect(ib651_2.data.windowId).to.equal(2);

			expect(ib651_3.data.communicationStatus).to.equal(1);
			expect(ib651_3.data.windowId).to.equal(3);
		};

		let test = async () => {
			try {
				await sendMessages();
				await timer(2000);
				await getResults();

				// let requestHelper = new RequestHelper();
				// let fin = await requestHelper.getAll();
				// console.log(JSON.stringify(fin));

				// let requestHelper2 = new RequestHelper();
				// let fin2 = await requestHelper2.getBlastModel();
				// console.log(JSON.stringify(fin2));
			} catch (err) {
				return Promise.reject(err);
			}
		};
		return test();
	});

	it("can process a packet containing IB651s 1, 2 & 3, where IB651s 1 & 2 are currently in database", async function() {
		let sendMessages = async () => {
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

		let getResults = async () => {
			let result = await client.exchange.nodeRepository.getAllNodes();
			if (result == null || result.length == 0)
				throw new Error("Empty result!");

			var ib651_1 = null,
				ib651_2 = null,
				ib651_3 = null;

			result.forEach(x => {
				if (parseInt(x.data.serial) == 1 && x.data.typeId == 2) ib651_1 = x;
				if (parseInt(x.data.serial) == 2 && x.data.typeId == 2) ib651_2 = x;
				if (parseInt(x.data.serial) == 3 && x.data.typeId == 2) ib651_3 = x;
			});

			expect(ib651_1.data.communicationStatus).to.equal(1);
			expect(ib651_1.data.windowId).to.equal(1);

			expect(ib651_2.data.communicationStatus).to.equal(1);
			expect(ib651_2.data.windowId).to.equal(2);

			expect(ib651_3.data.communicationStatus).to.equal(1);
			expect(ib651_3.data.windowId).to.equal(3);
		};

		let test = async () => {
			try {
				await sendMessages();
				await timer(2000);
				await getResults();

				// let requestHelper = new RequestHelper();
				// let fin = await requestHelper.getAll();
				// console.log(JSON.stringify(fin));

				// let requestHelper2 = new RequestHelper();
				// let fin2 = await requestHelper2.getBlastModel();
				// console.log(JSON.stringify(fin2));
			} catch (err) {
				return Promise.reject(err);
			}
		};

		return test();
	});

	it("can process a packet containing IB651s 1, 2 & 3, where only IB651 4 is currently in database", async function() {
		let sendMessages = async () => {
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

		let getResults = async () => {
			let result = await client.exchange.nodeRepository.getAllNodes();
			if (result == null || result.length == 0)
				throw new Error("Empty result!");

			var ib651_1 = null,
				ib651_2 = null,
				ib651_3 = null,
				ib651_4 = null;

			result.forEach(x => {
				if (parseInt(x.data.serial) == 1 && x.data.typeId == 2) ib651_1 = x;
				if (parseInt(x.data.serial) == 2 && x.data.typeId == 2) ib651_2 = x;
				if (parseInt(x.data.serial) == 3 && x.data.typeId == 2) ib651_3 = x;
				if (parseInt(x.data.serial) == 4 && x.data.typeId == 2) ib651_4 = x;
			});

			expect(ib651_1.data.communicationStatus).to.equal(1);
			expect(ib651_1.data.parentSerial).to.equal(ib651_1.data.serial);
			expect(ib651_1.data.windowId).to.equal(1);

			expect(ib651_2.data.communicationStatus).to.equal(1);
			expect(ib651_2.data.parentSerial).to.equal(ib651_2.data.serial);
			expect(ib651_2.data.windowId).to.equal(2);

			expect(ib651_3.data.communicationStatus).to.equal(1);
			expect(ib651_3.data.parentSerial).to.equal(ib651_3.data.serial);
			expect(ib651_3.data.windowId).to.equal(3);

			expect(ib651_4.data.communicationStatus).to.equal(0);
			expect(ib651_4.data.parentSerial).to.equal(ib651_4.data.serial);
			expect(result.ib651_4.data.windowId).to.equal(0);
		};

		let test = async () => {
			try {
				await sendMessages();
				await timer(2000);
				await getResults();
			} catch (err) {
				return Promise.reject(err);
			}
		};
		return test();
	});

	it("can process a packet that changes the ordering of window ids of existing IB651s in database", async function() {
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
				throw new Error("Empty result!");

			var ib651_1 = null,
				ib651_2 = null,
				ib651_3 = null;

			result.forEach(x => {
				if (x["c.serial"] == 2 && x["c.typeId"] == 2) ib651_2 = x;
				if (x["c.serial"] == 1 && x["c.typeId"] == 2) ib651_1 = x;
				if (x["c.serial"] == 3 && x["c.typeId"] == 2) ib651_3 = x;
			});

			return {
				ib651_1: ib651_1,
				ib651_2: ib651_2,
				ib651_3: ib651_3
			};
		};

		let step3 = async result => {
			try {
				expect(result.ib651_2["c.windowId"]).to.equal(1);
				expect(result.ib651_1["c.windowId"]).to.equal(2);
				expect(result.ib651_3["c.windowId"]).to.equal(3);
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
