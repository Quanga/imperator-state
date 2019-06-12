const expect = require("expect.js");
var Mesh = require("happner-2");
const ServerHelper = require("../../helpers/server_helper");
const SerialPortHelper = require("../../helpers/serial_port_helper");
const PacketConstructor = require("../../../lib/builders/packetConstructor");

describe("E2E - CONTROL UNIT data tests", async function() {
	this.timeout(10000);

	let serverHelper = new ServerHelper();
	const serialPortHelper = new SerialPortHelper();

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
			await serialPortHelper.initialise();
			await serverHelper.startServer();
			await AsyncLogin();
		} catch (err) {
			return Promise.reject(err);
		}
	});

	beforeEach(
		"delete all current nodes, logs, warnings and packets",
		async function() {
			await client.exchange.nodeRepository.delete("*");
			await client.exchange.logsRepository.deleteAll();
			await client.exchange.warningsRepository.deleteAll();
			await client.exchange.packetRepository.delete("*");
		}
	);

	after("stop test server", async function() {
		client.disconnect();
		await serverHelper.stopServer();
		await serialPortHelper.destroy();
	});

	it("can process key switch armed on IBC 8 where previous state was disarmed", async function() {
		let sendMessage = async () => {
			try {
				let initial = new PacketConstructor(8, 12, {
					data: [0, 0, 0, 0, 0, 0, 0, 0]
				}).packet;
				await serialPortHelper.sendMessage(initial);

				let message = new PacketConstructor(8, 12, {
					data: [0, 0, 0, 0, 0, 0, 1, 1]
				}).packet;
				await serialPortHelper.sendMessage(message);

				await checkDatabase();
			} catch (err) {
				return Promise.reject(err);
			}
		};

		let checkDatabase = async () => {
			try {
				await timer(1000);
				let result = await client.exchange.nodeRepository.getAllNodes();

				if (result == null || result.length == 0) {
					throw new Error("Empty result!");
				}

				let ibc = result[0];

				expect(ibc.data.communicationStatus).to.equal(1);
				expect(ibc.data.fireButton).to.equal(0);
				expect(ibc.data.keySwitchStatus).to.equal(1);
				expect(ibc.data.isolationRelay).to.equal(1);
			} catch (err) {
				return Promise.reject(err);
			}
		};

		await sendMessage();
	});

	it("can process a key switch disarmed on IBC 8 where previous state armed", async function() {
		let sendMessages = async () => {
			let initial = new PacketConstructor(8, 8, {
				data: [0, 0, 0, 0, 0, 0, 1, 1]
			}).packet;
			await serialPortHelper.sendMessage(initial);

			let message2 = new PacketConstructor(8, 8, {
				data: [0, 0, 0, 0, 0, 0, 1, 0]
			}).packet;
			await serialPortHelper.sendMessage(message2);
		};

		let getResults = async () => {
			try {
				await timer(500);
				let result = await client.exchange.nodeRepository.getAllNodes();

				if (result == null || result.length == 0) {
					throw new Error("Empty result!");
				}

				let ibc = result[0];

				expect(ibc.data.communicationStatus).to.equal(1);
				expect(ibc.data.fireButton).to.equal(0);
				expect(ibc.data.keySwitchStatus).to.equal(0);
				expect(ibc.data.isolationRelay).to.equal(1);
			} catch (err) {
				return Promise.reject(err);
			}
		};

		let test = async () => {
			try {
				await sendMessages();
				await getResults();
			} catch (err) {
				return Promise.reject(err);
			}
		};

		return test();
	});
});
