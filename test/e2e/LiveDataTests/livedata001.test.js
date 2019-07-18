//const expect = require("expect.js");
const ServerHelper = require("../../helpers/server_helper");
const PacketConstructor = require("../../../lib/builders/packetConstructor");
const Queue = require("better-queue");
const Mesh = require("happner-2");
const data = require("./test001_data");

require("dotenv").config();
process.env.USE_ENDPOINT = false;

describe("E2E - LIVE DATA TEST", async function() {
	this.timeout(15000);
	let serverHelper = new ServerHelper();
	let client;

	const sendQueue = new Queue((task, cb) => {
		setTimeout(() => {
			client.exchange.queueService.addToQueue(task.message);
			cb();
		}, task.wait);
	});

	const timer = ms => {
		return new Promise(resolve => setTimeout(resolve, ms));
	};

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

	beforeEach("delete all current nodes, logs, warnings", async function() {
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
			wait: 300
		});
	});

	after("stop test server", async function() {
		client.disconnect();
		await serverHelper.stopServer();
		//await timer(300);
	});

	it("can process a packet with CBBs Data 1 where no CBBs currently in database", async function() {
		data.forEach(entry =>
			sendQueue.push({
				message: {
					packet: entry.packet,
					created: entry.created
				},
				wait: 100
			})
		);

		await holdAsync();
		await timer(3000);

		//let resultPresist = await client.exchange.nodeRepository.getAllNodes();
		// let resultDataService = await client.exchange.dataService.getSnapShot();
		// if (resultPresist == null || resultPresist.length === 0)
		// 	throw new Error("Empty result!");

		// let cbb = await resultPresist.find(
		// 	unit => parseInt(unit.serial) === 13 && unit.typeId === 3
		// );

		// expect(cbb.communicationStatus).to.equal(1); // communication status
		// expect(cbb.childCount).to.equal(0);
		// expect(resultDataService.units["13"].data.communicationStatus).to.equal(1);
		// expect(resultDataService.units["13"].data.childCount).to.equal(0);

		let snapshot = await client.exchange.dataService.getSnapShot();
		console.log(JSON.stringify(snapshot));
		await timer(2000);
	});
});
