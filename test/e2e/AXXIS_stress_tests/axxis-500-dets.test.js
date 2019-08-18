const ServerHelper = require("../../helpers/server_helper");
const PacketConstructor = require("../../../lib/builders/packetConstructor");
var Mesh = require("happner-2");
const Queue = require("better-queue");

describe("E2E - can handle 500 detonators", async function() {
	let serverHelper = new ServerHelper();

	var client;

	this.timeout(60000);

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

	let timer = ms => {
		return new Promise(resolve => setTimeout(resolve, ms));
	};

	const AsyncLogin = () =>
		new Promise((resolve, reject) => {
			client.on("login/allow", () => resolve());

			client.on("login/deny", e => {
				console.log(e);
				return reject(e);
			});
			client.on("login/error", e => {
				console.log(e);
				return reject(e);
			});
			client.login({
				username: "_ADMIN",
				password: "happn"
			});
		});

	before("cleaning up db", async function() {
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

	beforeEach("delete all current nodes, logs, warnings and packets", async function() {
		await client.exchange.logsRepository.deleteAll();
		await client.exchange.warningsRepository.deleteAll();
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

	after("stop test server", async function() {
		client.disconnect();
		await serverHelper.stopServer();
	});

	it("can process 500 units", async function() {
		//const { data } = require("../../data/test500DataTemp");
		const { data } = require("../../data/test500Data");

		let sendMessage = async () => {
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
		};

		let testAsync = async () => {
			await sendMessage();
			await timer(25000);
			//1. send 500 units to the serialport
		};

		return testAsync();
	});
});
