/* eslint-disable no-unused-vars */
const expect = require("expect.js");
var Mesh = require("happner-2");
const ServerHelper = require("../../helpers/server_helper");
const PacketConstructor = require("../../../lib/builders/packetConstructor");
const util = require("../../helpers/utils");

describe("UNIT - Parser", function() {
	this.timeout(30000);
	let serverHelper = new ServerHelper();

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

	xcontext("IBS - 651 list", async () => {
		before("cleaning up db", async function() {
			try {
				// await serialPortHelper.initialise();
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
			// await serialPortHelper.destroy();
		});

		it("can process a packet containing IB651s 1, 2 & 3, where no IB651s currently in database", async function() {
			const message = new PacketConstructor(1, 1, {
				data: [1]
			}).packet;
			// await serialPortHelper.sendMessage(message);

			const messageb = new PacketConstructor(2, 1, {
				data: [1, 2, 3]
			}).packet;
			// await serialPortHelper.sendMessage(messageb);

			await util.timer(1000);
			let result = await client.exchange.nodeRepository.getAllNodes();

			if (result == null || result.length == 0) throw new Error("Empty result!");

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
		});

		it("can process a packet containing IB651s 1, 2 & 3, where IB651s 1 & 2 are currently in database", async function() {
			const message = new PacketConstructor(1, 1, {
				data: [1]
			}).packet;
			// await serialPortHelper.sendMessage(message);

			const messageb = new PacketConstructor(2, 1, {
				data: [1, 2]
			}).packet;
			// await serialPortHelper.sendMessage(messageb);

			const messagec = new PacketConstructor(2, 1, {
				data: [1, 2, 3]
			}).packet;
			// await serialPortHelper.sendMessage(messagec);

			await util.timer(2000);

			let result = await client.exchange.nodeRepository.getAllNodes();
			if (result == null || result.length == 0) throw new Error("Empty result!");

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
		});

		it("can process a packet containing IB651s 1, 2 & 3, where only IB651 4 is currently in database", async function() {
			const message = new PacketConstructor(1, 1, {
				data: [1]
			}).packet;
			// await serialPortHelper.sendMessage(message);

			const messageb = new PacketConstructor(2, 1, {
				data: [4]
			}).packet;
			// await serialPortHelper.sendMessage(messageb);

			const messagec = new PacketConstructor(2, 1, {
				data: [1, 2, 3]
			}).packet;
			// await serialPortHelper.sendMessage(messagec);

			await util.timer(2000);
			let result = await client.exchange.nodeRepository.getAllNodes();
			if (result == null || result.length == 0) throw new Error("Empty result!");

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
		});

		it("can process a packet that changes the ordering of window ids of existing IB651s in database", async function() {
			const message = new PacketConstructor(1, 1, {
				data: [1]
			}).packet;
			// await serialPortHelper.sendMessage(message);

			const messageb = new PacketConstructor(2, 1, {
				data: [1, 2, 3]
			}).packet;
			// await serialPortHelper.sendMessage(messageb);

			const messagec = new PacketConstructor(2, 1, {
				data: [2, 1, 3]
			}).packet;
			// await serialPortHelper.sendMessage(messagec);

			//await serialPortHelper.sendMessage(messageb);

			await util.timer(1000);
			let result;
			if (result == null || result.length == 0) throw new Error("Empty result!");

			var ib651_1 = null,
				ib651_2 = null,
				ib651_3 = null;

			result.forEach(x => {
				if (x["c.serial"] == 2 && x["c.typeId"] == 2) ib651_2 = x;
				if (x["c.serial"] == 1 && x["c.typeId"] == 2) ib651_1 = x;
				if (x["c.serial"] == 3 && x["c.typeId"] == 2) ib651_3 = x;
			});

			let resultObj = {
				ib651_1: ib651_1,
				ib651_2: ib651_2,
				ib651_3: ib651_3
			};

			expect(resultObj.ib651_2["c.windowId"]).to.equal(1);
			expect(resultObj.ib651_1["c.windowId"]).to.equal(2);
			expect(resultObj.ib651_3["c.windowId"]).to.equal(3);
		});
	});
});
