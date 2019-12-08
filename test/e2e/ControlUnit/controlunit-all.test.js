const chai = require("chai");
const expect = chai.expect;
chai.use(require("chai-match"));

var Mesh = require("happner-2");
const ServerHelper = require("../../helpers/server_helper");
const PktBldr = require("imperator-packet-constructor");
const Queue = require("better-queue");
const utils = require("../../helpers/utils");
const fields = require("../../../lib/configs/fields/fieldConstants");
const { communicationStatus, fireButton, keySwitchStatus, isolationRelay } = fields;

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

	const AsyncLogin = () =>
		new Promise((resolve, reject) => {
			client.on("login/allow", () => {
				resolve();
			});

			client.on("login/deny", () => reject());

			client.on("login/error", () => {
				console.log("CLIENT ISSUE::::::");
			});

			client.login({
				username: "_ADMIN",
				password: "happn",
			});
		});

	context("Control Unit data", async () => {
		before(async () => {
			try {
				await serverHelper.startServer();

				client = await new Mesh.MeshClient({
					secure: true,
					port: 55000,
				});

				await AsyncLogin();
			} catch (err) {
				return Promise.reject(err);
			}
		});

		beforeEach(async () => {
			await client.exchange.logsRepository.delete("*");
			await client.exchange.warningsRepository.delete("*");
			await client.exchange.nodeRepository.delete("*");
			await client.exchange.dataService.clearDataModel();

			sendQueue.push({
				message: {
					packet: PktBldr.withCommand(8)
						.withParent(12)
						.withData([0, 0, 0, 0, 0, 0, 0, 1])
						.build(),
					createdAt: Date.now(),
				},
				wait: 300,
			});
		});

		after(async () => {
			client.disconnect();
			await serverHelper.stopServer();
		});

		it("can process key switch armed on IBC 8 where previous state was disarmed", async () => {
			sendQueue.push({
				message: {
					packet: PktBldr.withCommand(8)
						.withParent(12)
						.withData([0, 0, 0, 0, 0, 0, 0, 0])
						.build(),
					createdAt: Date.now(),
				},
				wait: 300,
			});

			sendQueue.push({
				message: {
					packet: PktBldr.withCommand(8)
						.withParent(12)
						.withData([0, 0, 0, 0, 0, 0, 1, 1])
						.build(),
					createdAt: Date.now(),
				},
				wait: 300,
			});

			await utils.holdTillDrained(sendQueue);
			await utils.timer(2000);

			const result = await client.exchange.nodeRepository.get("*");
			console.log(result);
			expect(result[0].state[communicationStatus]).to.equal(1);
			expect(result[0].data[fireButton]).to.equal(0);
			expect(result[0].data[keySwitchStatus]).to.equal(1);
			expect(result[0].data[isolationRelay]).to.equal(1);
		});

		it("can process a key switch disarmed on IBC 8 where previous state armed", async function() {
			sendQueue.push({
				message: {
					packet: PktBldr.withCommand(8)
						.withParent(12)
						.withData([0, 0, 0, 0, 0, 0, 1, 1])
						.build(),
					createdAt: Date.now(),
				},
				wait: 300,
			});

			sendQueue.push({
				message: {
					packet: PktBldr.withCommand(8)
						.withParent(12)
						.withData([0, 0, 0, 0, 0, 0, 1, 0])
						.build(),
					createdAt: Date.now(),
				},
				wait: 300,
			});

			await utils.holdTillDrained(sendQueue);
			await utils.timer(1000);

			const result = await client.exchange.nodeRepository.get("*");

			expect(result[0].state[communicationStatus]).to.equal(1);
			expect(result[0].data[fireButton]).to.equal(0);
			expect(result[0].data[keySwitchStatus]).to.equal(0);
			expect(result[0].data[isolationRelay]).to.equal(1);
		});
	});
});
