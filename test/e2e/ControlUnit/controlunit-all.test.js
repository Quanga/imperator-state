const expect = require("expect.js");
var Mesh = require("happner-2");
const ServerHelper = require("../../helpers/server_helper");
const PacketConstructor = require("../../../lib/builders/packetConstructor");
const Queue = require("better-queue");
const utils = require("../../helpers/utils");

describe("INTEGRATION - Units", async function() {
	this.timeout(15000);
	let serverHelper = new ServerHelper();
	var client;

	const sendQueue = new Queue((task, cb) => {
		setTimeout(() => {
			client.exchange.queueService.processIncoming(task.message);
			cb();
		}, task.wait);
	});

	const holdAsync = () =>
		new Promise(resolve => {
			sendQueue.on("drain", () => {
				return resolve();
			});
		});

	const AsyncLogin = () =>
		new Promise((resolve, reject) => {
			client.on("login/allow", () => {
				console.log("CLIENT CONNECTED:::::::::::::::::::::::::");
				resolve();
			});

			client.on("login/deny", () => reject());

			client.on("login/error", () => {
				console.log("CLIENT ISSUE::::::");
			});

			client.login({
				username: "_ADMIN",
				password: "happn"
			});
		});

	context("Control Unit data", async () => {
		before(async () => {
			try {
				await serverHelper.startServer();

				client = await new Mesh.MeshClient({
					secure: true,
					port: 55000
				});

				await AsyncLogin();
			} catch (err) {
				return Promise.reject(err);
			}
		});

		beforeEach(async () => {
			await client.exchange.logsRepository.delete("*");
			await client.exchange.warningsRepository.deleteAll();
			await client.exchange.nodeRepository.delete("*");
			await client.exchange.dataService.clearDataModel();

			sendQueue.push({
				message: {
					packet: new PacketConstructor(8, 12, {
						data: [0, 0, 0, 0, 0, 0, 0, 1]
					}).packet,
					createdAt: Date.now()
				},
				wait: 300
			});
		});

		after(async () => {
			client.disconnect();
			await serverHelper.stopServer();
		});

		it("can process key switch armed on IBC 8 where previous state was disarmed", async function() {
			sendQueue.push({
				message: {
					packet: new PacketConstructor(8, 12, {
						data: [0, 0, 0, 0, 0, 0, 0, 0]
					}).packet,
					createdAt: Date.now()
				},
				wait: 300
			});

			sendQueue.push({
				message: {
					packet: new PacketConstructor(8, 12, {
						data: [0, 0, 0, 0, 0, 0, 1, 1]
					}).packet,
					createdAt: Date.now()
				},
				wait: 300
			});

			await holdAsync();
			await utils.timer(2000);

			let result = await client.exchange.nodeRepository.getAllNodes();

			if (result == null || result.length == 0) {
				throw new Error("Empty result!");
			}

			let ibc = result[0];

			expect(ibc.communicationStatus).to.equal(1);
			expect(ibc.fireButton).to.equal(0);
			expect(ibc.keySwitchStatus).to.equal(1);
			expect(ibc.isolationRelay).to.equal(1);
		});

		it("can process a key switch disarmed on IBC 8 where previous state armed", async function() {
			sendQueue.push({
				message: {
					packet: new PacketConstructor(8, 12, {
						data: [0, 0, 0, 0, 0, 0, 1, 1]
					}).packet,
					createdAt: Date.now()
				},
				wait: 300
			});

			sendQueue.push({
				message: {
					packet: new PacketConstructor(8, 12, {
						data: [0, 0, 0, 0, 0, 0, 1, 0]
					}).packet,
					createdAt: Date.now()
				},
				wait: 300
			});

			await holdAsync();
			await utils.timer(1000);
			let result = await client.exchange.nodeRepository.getAllNodes();

			if (result == null || result.length == 0) {
				throw new Error("Empty result!");
			}

			let ibc = result[0];

			expect(ibc.communicationStatus).to.equal(1);
			expect(ibc.fireButton).to.equal(0);
			expect(ibc.keySwitchStatus).to.equal(0);
			expect(ibc.isolationRelay).to.equal(1);
		});
	});
});
