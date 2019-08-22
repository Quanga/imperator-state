/* eslint-disable no-unused-vars */
const expect = require("expect.js");
var Mesh = require("happner-2");
const ServerHelper = require("../../helpers/server_helper");
const PacketConstructor = require("../../../lib/builders/packetConstructor");
const util = require("../../helpers/utils");
const Queue = require("better-queue");

describe("E2E - Repository", async function() {
	this.timeout(10000);

	let client = null;
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

	let serverHelper = new ServerHelper();
	context("Node Repository", async () => {
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
			await client.exchange.logsRepository.deleteAll();
			await client.exchange.warningsRepository.deleteAll();
			await client.exchange.nodeRepository.delete("*");
			await client.exchange.dataService.clearDataModel();
		});

		after(async () => {
			client.disconnect();
			await serverHelper.stopServer();
		});

		it("can get the dets for a cbb by using the path", async function() {
			sendQueue.push({
				message: {
					packet: new PacketConstructor(8, 8, {
						data: [0, 0, 0, 0, 0, 0, 0, 1]
					}).packet,
					created: Date.now()
				},
				wait: 300
			});

			sendQueue.push({
				message: {
					packet: new PacketConstructor(4, 13, {
						data: [{ serial: 4423423, windowId: 1 }, { serial: 4523434, windowId: 2 }]
					}).packet,
					created: Date.now()
				},
				wait: 300
			});

			sendQueue.push({
				message: {
					packet: new PacketConstructor(5, 13, {
						data: [
							{
								serial: 13,
								childCount: 2,
								ledState: 6,
								rawData: [0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1]
							},
							{
								windowId: 2,
								rawData: [1, 0, 0, 0, 0, 0, 0, 1],
								delay: 2000
							}
						]
					}).packet,
					created: Date.now()
				},
				wait: 300
			});

			sendQueue.push({
				message: {
					packet: new PacketConstructor(5, 13, {
						data: [
							{
								serial: 13,
								childCount: 2,
								ledState: 6,
								rawData: [0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 1, 1]
							},
							{
								windowId: 2,
								rawData: [1, 0, 0, 0, 0, 1, 1, 1],
								delay: 3000
							}
						]
					}).packet,
					created: Date.now()
				},
				wait: 300
			});

			await holdAsync();
			await util.timer(2000);

			const dets = await client.exchange.nodeRepository.getDetonators("3/13");
			expect(dets[1].logged).to.eql(1);
			expect(dets[1].detonatorStatus).to.eql(0);
		});
	});
});
