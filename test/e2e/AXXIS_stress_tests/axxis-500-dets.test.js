const expect = require("expect.js");
const ServerHelper = require("../../helpers/server_helper");
const SerialPortHelper = require("../../helpers/serial_port_helper");
const PacketConstructor = require("../../../lib/builders/packetConstructor");
var Mesh = require("happner-2");

describe("E2E - can handle 500 detonators", function() {
	let serverHelper = new ServerHelper();
	const serialPortHelper = new SerialPortHelper();

	var client;

	this.timeout(60000);

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
		}
	);

	after("stop test server", async function() {
		client.disconnect();
		await serverHelper.stopServer();
		await serialPortHelper.destroy();
		await timer(2000);
	});

	it("can process 500 units", async function() {
		//const { data } = require("../../data/test500DataTemp");
		const { data } = require("../../data/test500Data");

		let sendMessage = async () => {
			let initial = new PacketConstructor(8, 8, {
				data: [0, 0, 0, 0, 0, 0, 0, 1]
			}).packet;
			await serialPortHelper.sendMessage(initial);

			// const message = new PacketConstructor(5, 13, {
			// 	data: [
			// 		{
			// 			serial: 65535,
			// 			window_id: 2,
			// 			ledState: 6,
			// 			rawData: [0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1]
			// 		}
			// 	]
			// }).packet;
			// await serialPortHelper.sendMessage(message);

			for (let index = 0; index < data.length; index++) {
				await serialPortHelper.sendMessage(data[index]);
			}

			for (let index = 0; index < data.length; index++) {
				await serialPortHelper.sendMessage(data[index]);
			}
		};

		let testAsync = async () => {
			await sendMessage();
			await timer(25000);
			//1. send 500 units to the serialport
		};

		return testAsync();
	});
});
