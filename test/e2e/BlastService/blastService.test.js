//const expect = require("expect.js");
const ServerHelper = require("../../helpers/server_helper");
const Mesh = require("happner-2");
const SimData = require("./blastMessages");
const Queue = require("better-queue");

const utils = require("../../helpers/utils");
describe("E2E - Services", async function() {
	this.timeout(25000);
	let serverHelper = new ServerHelper();
	var client;

	const sendQueue = new Queue((task, cb) => {
		setTimeout(() => {
			client.exchange.queueService.addToQueue(task.message);
			cb();
		}, task.wait);
	});

	const simData = new SimData();

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
		await client.exchange.nodeRepository.delete("*");
		await client.exchange.logsRepository.deleteAll();
		await client.exchange.warningsRepository.deleteAll();
		await client.exchange.blastRepository.delete("*");
	});

	after("stop test server", async function() {
		client.disconnect();
		await serverHelper.stopServer();
	});
	context("Blast Service", async () => {
		it("can create a new blast model from a snapshot", async function() {
			const logs = [];
			client.event.dataService.on("*", (data, meta) => {
				if (data.changes && data.changes.hasOwnProperty("communicationStatus")) {
					logs.push({ data, meta });
				}
			});

			const thisData = simData.createBlast1();
			thisData.forEach(messageObj => sendQueue.push(messageObj));

			const holdAsync = () =>
				new Promise(resolve => {
					sendQueue.on("drain", () => {
						return resolve();
					});
				});

			await holdAsync();

			await utils.timer(6000);
			let result = await client.exchange.blastRepository.get("index");
			delete result._meta;

			let blastIds = Object.keys(result);
			let firstBlastId = await client.exchange.blastRepository.get(blastIds[0]);
			delete firstBlastId._meta;

			//console.log(JSON.stringify(logs, null, 2));
			//console.log(result);
			//console.log(JSON.stringify(firstBlastId));
			console.log("byte length", JSON.stringify(firstBlastId).length);
		});
	});
});
