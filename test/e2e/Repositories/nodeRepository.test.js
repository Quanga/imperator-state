/* eslint-disable no-unused-vars */
const expect = require("expect.js");
var Mesh = require("happner-2");
const ServerHelper = require("../../helpers/server_helper");
const PacketConstructor = require("../../../lib/builders/packetConstructor");

describe("E2E- Node Repository Integrated Tests", async function() {
	this.timeout(10000);

	let serverHelper = new ServerHelper();

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
			// await serialPortHelper.initialise();
			await serverHelper.startServer();
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
		// await serialPortHelper.destroy();
	});

	it("can get the dets for a cbb by using the path", async function() {
		let sendMessages = async function() {
			let initial = new PacketConstructor(8, 8, {
				data: [0, 0, 0, 0, 0, 0, 0, 1]
			}).packet;
			// await serialPortHelper.sendMessage(initial);

			const initial2 = new PacketConstructor(4, 13, {
				data: [
					{ serial: 4423423, windowId: 1 },
					{ serial: 4523434, windowId: 2 }
				]
			}).packet;
			// await serialPortHelper.sendMessage(initial2);

			const message = new PacketConstructor(5, 13, {
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
			}).packet;
			// await serialPortHelper.sendMessage(message);

			const message2 = new PacketConstructor(5, 13, {
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
			}).packet;
			// await serialPortHelper.sendMessage(message2);
		};

		const checkFunc = async () => {
			const dets = await client.exchange.nodeRepository.getDetonators("3/13");
			expect(dets[1].logged).to.eql(1);
			expect(dets[1].detonatorStatus).to.eql(0);
		};
		const startTest = async () => {
			await sendMessages();
			await timer(4000);

			await checkFunc();
		};

		return startTest();
	});
});
