const expect = require("expect.js");
const ServerHelper = require("../../helpers/server_helper");
const SerialPortHelper = require("../../helpers/serial_port_helper");
const PacketConstructor = require("../../../lib/builders/packetConstructor");
var Mesh = require("happner-2");

require("dotenv").config();

describe("E2E - AXXIS - CBB data test", function() {
	let serverHelper = new ServerHelper();
	const serialPortHelper = new SerialPortHelper();

	var client;

	this.timeout(25000);

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
		}
	);

	after("stop test server", async function() {
		client.disconnect();
		await serverHelper.stopServer();
		await serialPortHelper.destroy();
		await timer(2000);
	});

	it("can process a packet with CBBs Data 1 where no CBBs currently in database", async function() {
		let sendMessages = async () => {
			let initial = new PacketConstructor(8, 8, {
				data: [0, 0, 0, 0, 0, 0, 0, 1]
			}).packet;
			await serialPortHelper.sendMessage(initial);

			const message = new PacketConstructor(5, 13, {
				data: [
					{
						serial: 13,
						windowId: 2,
						ledState: 6,
						rawData: [0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1]
					}
				]
			}).packet;
			await serialPortHelper.sendMessage(message);
		};

		let getResults = async () => {
			try {
				let result = await client.exchange.nodeRepository.getAllNodes();

				if (result == null || result.length === 0)
					throw new Error("Empty result!");

				let cbb = await result.find(
					unit => parseInt(unit.data.serial) === 13 && unit.data.typeId === 3
				);

				expect(cbb.data.communicationStatus).to.equal(1); // communication status
			} catch (err) {
				console.log(err);
				return Promise.reject(err);
			}
		};

		let startTest = async () => {
			try {
				await sendMessages();
				await timer(200);
				await getResults();
			} catch (err) {
				console.log(err);
				return Promise.reject(err);
			}
		};

		return startTest();
	});

	it("can process a packet with CBBs and EDD Data 1 where no CBBs currently in database", async () => {
		//client.exchange.queueService.deletetTests();
		//client.exchange.dataService.deletetTests();

		let sendMessages = async () => {
			let initial = new PacketConstructor(8, 8, {
				data: [0, 0, 0, 0, 0, 0, 0, 1]
			}).packet;
			await serialPortHelper.sendMessage(initial);

			const initial2 = new PacketConstructor(4, 13, {
				data: [
					{ serial: 4423423, windowId: 1 },
					{ serial: 4523434, windowId: 2 }
				]
			}).packet;
			await serialPortHelper.sendMessage(initial2);
			await timer(500);
			const message = new PacketConstructor(5, 13, {
				data: [
					{
						serial: 13,
						windowId: 2,
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
			await serialPortHelper.sendMessage(message);
		};

		let getResults2 = async () => {
			let result2 = await client.exchange.nodeRepository.getAllNodes();

			if (result2 === null || result2.length === 0)
				throw new Error("Empty result!");

			let cbb = null,
				edd1 = null;

			await result2.forEach(x => {
				if (parseInt(x.data.serial) === 13 && x.data.typeId === 3) cbb = x;
				if (parseInt(x.data.serial) === 4523434 && x.data.typeId === 4)
					edd1 = x;
			});

			expect(cbb.data.communicationStatus).to.equal(1); // communication status
			expect(edd1.data.windowId).to.equal(2); // communication status
			expect(edd1.data.delay).to.equal(2000); // communication status
		};

		let startTest = async () => {
			try {
				await sendMessages();
				await timer(1000);
				await getResults2();
				let tests = await client.exchange.dataService.getTests();
				//console.log("TESTS", JSON.stringify(tests, null, 2));
			} catch (err) {
				return Promise.reject(err);
			}
		};

		return startTest();
	});

	it("can process a packet with CBBs and EDD Data 1 where  CBBs  and EDD currently in database", async function() {
		let sendMessages = async function() {
			let initial = new PacketConstructor(8, 8, {
				data: [0, 0, 0, 0, 0, 0, 0, 1]
			}).packet;
			await serialPortHelper.sendMessage(initial);

			const initial2 = new PacketConstructor(4, 13, {
				data: [
					{ serial: 4423423, windowId: 1 },
					{ serial: 4523434, windowId: 2 }
				]
			}).packet;
			await serialPortHelper.sendMessage(initial2);

			const message = new PacketConstructor(5, 13, {
				data: [
					{
						serial: 13,
						windowId: 2,
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
			await serialPortHelper.sendMessage(message);

			const message2 = new PacketConstructor(5, 13, {
				data: [
					{
						serial: 13,
						windowId: 2,
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
			await serialPortHelper.sendMessage(message2);
		};

		let getResults3 = async function() {
			let result = await client.exchange.nodeRepository.getAllNodes();

			if (result == null || result.length === 0)
				throw new Error("Empty result!");

			let cbb = null,
				edd1 = null;

			result.forEach(x => {
				if (parseInt(x.data.serial) === 13 && x.data.typeId === 3) cbb = x;
				if (parseInt(x.data.serial) === 4523434 && x.data.typeId === 4)
					edd1 = x;
			});

			expect(cbb.data.communicationStatus).to.equal(1); // communication status
			expect(edd1.data.windowId).to.equal(2); // communication status
			expect(edd1.data.delay).to.equal(3000); // communication status
		};

		let startTest = async function() {
			try {
				await sendMessages();
				await timer(2000);

				await getResults3();
			} catch (err) {
				return Promise.reject(err);
			}
		};

		return startTest();
	});

	it("can process a change packet with CBBs and EDD Data 1 where  CBBs and EDD currently in database", async function() {
		let sendMessages = async function() {
			const data1 = {
				data: [0, 0, 0, 0, 0, 0, 0, 1]
			};

			let initial = new PacketConstructor(8, 8, data1);
			await serialPortHelper.sendMessage(initial.packet);

			const data2 = {
				data: [
					{ serial: 4423423, windowId: 1 },
					{ serial: 4523434, windowId: 2 }
				]
			};

			await timer(2000);

			const initial2 = new PacketConstructor(4, 13, data2);
			await serialPortHelper.sendMessage(initial2.packet);

			const data3 = {
				data: [
					{
						serial: 13,
						windowId: 2,
						ledState: 6,
						rawData: [0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1]
					},
					{
						windowId: 2,
						rawData: [1, 0, 0, 0, 0, 0, 0, 1],
						delay: 2000
					}
				]
			};

			const message = new PacketConstructor(5, 13, data3);
			await serialPortHelper.sendMessage(message.packet);

			const data4 = {
				data: [
					{
						serial: 13,
						windowId: 2,
						ledState: 6,
						rawData: [0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 1, 0]
					},
					{
						windowId: 2,
						rawData: [1, 0, 0, 0, 0, 1, 1, 1],
						delay: 3000
					}
				]
			};

			const message2 = new PacketConstructor(5, 13, data4);
			await serialPortHelper.sendMessage(message2.packet);

			const data6 = {
				data: [
					{
						serial: 13,
						windowId: 2,
						ledState: 6,
						rawData: [0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 1, 0, 1, 1, 1]
					},
					{
						windowId: 2,
						rawData: [1, 0, 0, 0, 0, 1, 1, 1],
						delay: 3000
					}
				]
			};

			const message4 = new PacketConstructor(5, 13, data6);
			await serialPortHelper.sendMessage(message4.packet);
		};

		// let getResults4 = async function() {
		// 	try {
		// 		let requestHelper = new RequestHelper();
		// 		let result = await requestHelper.getBlastModel();

		// 		return result;
		// 	} catch (err) {
		// 		return Promise.reject(err);
		// 	}
		// };

		let getResults = async function() {
			let result = await client.exchange.nodeRepository.getAllNodes();

			if (result == null || result.length == 0)
				throw new Error("Empty result!");

			let cbb = null,
				edd1 = null;

			result.forEach(x => {
				if (parseInt(x.data.serial) === 13 && x.data.typeId === 3) cbb = x;
				if (parseInt(x.data.serial) === 4523434 && x.data.typeId === 4)
					edd1 = x;
			});

			expect(cbb.data.communicationStatus).to.equal(1); // communication status
			expect(edd1.data.windowId).to.equal(2); // communication status
			expect(edd1.data.delay).to.equal(3000); // communication status

			// let edds = requestb.find(x => x.typeId === 4);
			// expect(edds).to.be.equal(null);
		};

		let startTest = async function() {
			try {
				await sendMessages();
				await timer(1000);

				await getResults();
			} catch (err) {
				return Promise.reject(err);
			}
		};

		return startTest();
	});
});
