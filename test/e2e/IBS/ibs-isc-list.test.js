/* eslint-disable no-unused-vars */
const expect = require("expect.js");
var Mesh = require("happner-2");
const ServerHelper = require("../../helpers/server_helper");
const PacketConstructor = require("../../../lib/builders/packetConstructor");
const util = require("../../helpers/utils");

describe("INTEGRATION - Units", function() {
	this.timeout(20000);
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
	xcontext("Type 2", async () => {
		before(async () => {
			try {
				// await serialPortHelper.initialise();
				await serverHelper.startServer();
				await AsyncLogin();
			} catch (err) {
				return Promise.reject(err);
			}
		});

		beforeEach(async () => {
			client.exchange.nodeRepository.deleteAll();
		});

		after(async () => {
			client.disconnect();
			await serverHelper.stopServer();
			// await serialPortHelper.destroy();
		});

		it("can process a packet with ISCs 1, 2 & 3, where no ISCs currently in database", async function() {
			const message = new PacketConstructor(1, 1, {
				data: [1, 2, 3]
			}).packet;
			// await serialPortHelper.sendMessage(message);

			let result = await client.exchange.nodeRepository.getAllNodes();

			if (result == null || result.length == 0) throw new Error("Empty result!");

			let isc1 = null,
				isc2 = null,
				isc3 = null;

			result.forEach(x => {
				if (parseInt(x["c.serial"]) === 1 && x["c.type_id"] == 1) isc1 = x;
				if (parseInt(x["c.serial"]) === 2 && x["c.type_id"] == 1) isc2 = x;
				if (parseInt(x["c.serial"]) === 3 && x["c.type_id"] == 1) isc3 = x;
			});

			const resobj = { isc1: isc1, isc2: isc2, isc3: isc3 };

			expect(resobj.isc1["c.communication_status"]).to.equal(1); // communication status
			expect(resobj.isc2["c.communication_status"]).to.equal(1);
			expect(resobj.isc3["c.communication_status"]).to.equal(1);
		});

		it("can process a packet containing ISCs 1, 2 & 3, where ISCs 1 & 2 are currently in database", async function() {
			const initial = new PacketConstructor(1, 1, {
				data: [1, 2]
			}).packet;
			// await serialPortHelper.sendMessage(initial);

			let message = new PacketConstructor(1, 1, {
				data: [1, 2, 3]
			}).packet;
			// await serialPortHelper.sendMessage(message);

			let dbresult = await client.exchange.nodeRepository.getAllNodes();

			if (dbresult == null || dbresult.length == 0) throw new Error("Empty dbresult!");

			let isc1 = null,
				isc2 = null,
				isc3 = null;

			dbresult.forEach(x => {
				if (x["c.serial"] == 1 && x["c.type_id"] == 1) isc1 = x;
				if (x["c.serial"] == 2 && x["c.type_id"] == 1) isc2 = x;
				if (x["c.serial"] == 3 && x["c.type_id"] == 1) isc3 = x;
			});
			const resObj = { isc1: isc1, isc2: isc2, isc3: isc3 };

			expect(resObj.isc1["c.communication_status"]).to.equal(1);
			expect(resObj.isc2["c.communication_status"]).to.equal(1);
			expect(resObj.isc3["c.communication_status"]).to.equal(1);
		});

		it("can process a packet containing ISCs 1, 2 & 3, where only ISC 4 is currently in database", async function() {
			const initial = new PacketConstructor(1, 1, {
				data: [4]
			}).packet;
			// await serialPortHelper.sendMessage(initial);

			const message = new PacketConstructor(1, 1, {
				data: [1, 2, 3]
			}).packet;
			// await serialPortHelper.sendMessage(message);

			let result = await client.exchange.nodeRepository.getAllNodes();
			if (result == null || result.length == 0) throw new Error("Empty result!");

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
			const resobj = { isc1: isc1, isc2: isc2, isc3: isc3, isc4: isc4 };

			expect(result.isc1["c.communication_status"]).to.equal(1);
			expect(result.isc2["c.communication_status"]).to.equal(1);
			expect(result.isc3["c.communication_status"]).to.equal(1);
			expect(result.isc4["c.communication_status"]).to.equal(1);
		});
	});
});
