//const expect = require("expect.js");
const ServerHelper = require("../../helpers/server_helper");
const SerialPortHelper = require("../../helpers/serial_port_helper");
const Mesh = require("happner-2");
const SimData = require("./blastMessages");
const Queue = require("better-queue");

require("dotenv").config();

describe("E2E - BLAST SERVICE tests", function() {
	let serverHelper = new ServerHelper();
	const serialPortHelper = new SerialPortHelper();
	const simData = new SimData();

	var client;

	this.timeout(20000);

	let timer = ms => {
		return new Promise(resolve => setTimeout(resolve, ms));
	};

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
			await serialPortHelper.initialise();
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

	beforeEach(
		"delete all current nodes, logs, warnings and packets",
		async function() {
			await client.exchange.nodeRepository.deleteAll();
			await client.exchange.logsRepository.deleteAll();
			await client.exchange.warningsRepository.deleteAll();
			await client.exchange.packetRepository.deleteAll();
			await client.exchange.blastRepository.delete("*");
		}
	);

	after("stop test server", async function() {
		client.disconnect();
		await serverHelper.stopServer();
		await serialPortHelper.destroy();
		await timer(2000);
	});

	it("can create a new blast model from a snapshot", async function() {
		let sendMessages = async () => {
			var sendQueue = new Queue((task, cb) => {
				setTimeout(() => {
					serialPortHelper.sendMessage(task.message);
					cb();
				}, task.wait);
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
		};

		let getResults = async () => {
			await timer(6000);
			let result = await client.exchange.blastRepository.get("index");
			delete result._meta;

			let blastIds = Object.keys(result);
			let firstBlastId = await client.exchange.blastRepository.get(blastIds[0]);
			delete firstBlastId._meta;
			// console.log(result);
			// console.log(JSON.stringify(firstBlastId));
			// console.log("byte length", JSON.stringify(firstBlastId).length);
		};

		let startTest = async () => {
			try {
				await sendMessages();
				await getResults();
			} catch (err) {
				console.log(err);
				return Promise.reject(err);
			}
		};

		return startTest();
	});
});
