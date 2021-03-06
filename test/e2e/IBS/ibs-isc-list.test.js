/* eslint-disable no-unused-vars */
const expect = require("expect.js");
var Mesh = require("happner-2");
const ServerHelper = require("../../helpers/server_helper");
const PacketConstructor = require("../../../lib/builders/packetConstructor");

describe("IBS - ISC list test", function() {
	let serverHelper = new ServerHelper();

	this.timeout(20000);

	let timer = ms => {
		return new Promise(resolve => setTimeout(resolve, ms));
	};

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

	it("can process a packet with ISCs 1, 2 & 3, where no ISCs currently in database", async function() {
		let step1 = async function() {
			const message = new PacketConstructor(1, 1, {
				data: [1, 2, 3]
			}).packet;
			// await serialPortHelper.sendMessage(message);
		};

		let step2 = async function() {
			let result = await client.exchange.nodeRepository.getAllNodes();

			if (result == null || result.length == 0)
				throw new Error("Empty result!");

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
				return Promise.reject(err);
			}
		};

		let startTest = async function() {
			try {
				await timer(4500);
				await step1();
				await timer(3000);
				let result = await step2();
				await step3(result);
			} catch (err) {
				return Promise.reject(err);
			}
		};

		return startTest();
	});

	it("can process a packet containing ISCs 1, 2 & 3, where ISCs 1 & 2 are currently in database", async function() {
		let step1 = async function() {
			const initial = new PacketConstructor(1, 1, {
				data: [1, 2]
			}).packet;
			// await serialPortHelper.sendMessage(initial);

			let message = new PacketConstructor(1, 1, {
				data: [1, 2, 3]
			}).packet;
			// await serialPortHelper.sendMessage(message);
		};

		let step2 = async function() {
			let dbresult = await client.exchange.nodeRepository.getAllNodes();

			if (dbresult == null || dbresult.length == 0)
				throw new Error("Empty dbresult!");

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
				await timer(5000);
				let result = await step2();
				await step4(result);
			} catch (err) {
				return Promise.reject(err);
			}
		};

		return startTest();
	});

	it("can process a packet containing ISCs 1, 2 & 3, where only ISC 4 is currently in database", async function() {
		let step1 = async () => {
			const initial = new PacketConstructor(1, 1, {
				data: [4]
			}).packet;
			// await serialPortHelper.sendMessage(initial);

			const message = new PacketConstructor(1, 1, {
				data: [1, 2, 3]
			}).packet;
			// await serialPortHelper.sendMessage(message);
		};

		let step2 = async () => {
			let result = await client.exchange.nodeRepository.getAllNodes();
			if (result == null || result.length == 0)
				throw new Error("Empty result!");

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
