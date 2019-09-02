const ServerHelper = require("../../helpers/server_helper");
const PacketConstructor = require("../../../lib/builders/packetConstructor");
var Mesh = require("happner-2");
const Queue = require("better-queue");
const util = require("../../helpers/utils");

describe("LIVE DATA", async function() {
	this.timeout(60000);
	let serverHelper = new ServerHelper();
	var client;

	const sendQueue = new Queue((task, cb) => {
		setTimeout(() => {
			client.exchange.queueService.addToQueue(task.message);
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
			client.on("login/allow", () => resolve());

			client.on("login/deny", e => {
				console.log(e);
				return reject(e);
			});

			client.login({
				username: "_ADMIN",
				password: "happn"
			});
		});

	context("can handle 500 detonators", async () => {
		before(async () => {
			await serverHelper.startServer();

			client = await new Mesh.MeshClient({
				secure: true,
				port: 55000
			});

			await AsyncLogin();
		});

		beforeEach(async () => {
			await client.exchange.logsRepository.delete("*");
			await client.exchange.warningsRepository.delete("");
			await client.exchange.nodeRepository.delete("*");
			await client.exchange.dataService.clearDataModel();

			sendQueue.push({
				message: {
					packet: new PacketConstructor(8, 8, {
						data: [0, 0, 0, 0, 0, 0, 0, 1]
					}).packet,
					created: Date.now()
				},
				wait: 100
			});
		});

		after(async () => {
			client.disconnect();
			await serverHelper.stopServer();
		});

		xit("can process 500 units", async () => {
			const { data } = require("../../data/test500Data");

			for (let index = 0; index < data.length; index++) {
				sendQueue.push({
					message: {
						packet: data[index],
						created: Date.now()
					},
					wait: 15
				});
			}

			await holdAsync();
			await util.timer(25000);
		});
	});
});
