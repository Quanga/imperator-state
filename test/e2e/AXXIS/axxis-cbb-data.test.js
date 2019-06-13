const expect = require("expect.js");
const ServerHelper = require("../../helpers/server_helper");
const SerialPortHelper = require("../../helpers/serial_port_helper");
const PacketConstructor = require("../../../lib/builders/packetConstructor");
const Queue = require("better-queue");
const Mesh = require("happner-2");

require("dotenv").config();

describe("E2E - AXXIS - CBB data test", function() {
	this.timeout(25000);
	let serverHelper = new ServerHelper();
	const serialPortHelper = new SerialPortHelper();

	const sendQueue = new Queue((task, cb) => {
		setTimeout(() => {
			serialPortHelper.sendMessage(task.message);
			cb();
		}, task.wait);
	});

	var client;

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
			await client.exchange.logsRepository.deleteAll();
			await client.exchange.warningsRepository.deleteAll();
			await client.exchange.packetRepository.delete("*");
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
			sendQueue.push({
				message: new PacketConstructor(8, 8, {
					data: [0, 0, 0, 0, 0, 0, 0, 1]
				}).packet,
				wait: 300
			});

			sendQueue.push({
				message: new PacketConstructor(5, 13, {
					data: [
						{
							serial: 13,
							childCount: 2,
							ledState: 6,
							rawData: [0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1]
						}
					]
				}).packet,
				wait: 300
			});

			await holdAsync();
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
				expect(cbb.data.childCount).to.equal(2);
				expect(cbb.data.loadCount).to.equal(0);
			} catch (err) {
				console.log(err);
				return Promise.reject(err);
			}
		};

		let startTest = async () => {
			try {
				await sendMessages();
				await timer(2000);
				await getResults();
			} catch (err) {
				console.log(err);
				return Promise.reject(err);
			}
		};

		return startTest();
	});

	it("can process a packet with CBBs and EDD Data 1 where no CBBs currently in database", async () => {
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
			await serialPortHelper.sendMessage(message);
		};

		let getResults2 = async () => {
			await timer(2000);
			let result2 = await client.exchange.nodeRepository.getAllNodes();
			console.log(result2);
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
			expect(cbb.data.childCount).to.equal(2);
			expect(cbb.data.loadCount).to.equal(2);
		};

		let startTest = async () => {
			try {
				await sendMessages();
				await timer(1000);
				await getResults2();
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
			await serialPortHelper.sendMessage(message);

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

			console.log(cbb);
			expect(cbb.data.communicationStatus).to.equal(1); // communication status
			expect(edd1.data.windowId).to.equal(2); // communication status
			expect(edd1.data.delay).to.equal(3000); // communication status
			expect(cbb.data.childCount).to.equal(2);
			expect(cbb.data.loadCount).to.equal(2);
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

	it("can handle a packet with CBBs and EDD Data 1 where CBBs  is current  and EDD not in database", async function() {
		let sendMessages = async function() {
			let initial = new PacketConstructor(8, 8, {
				data: [0, 0, 0, 0, 0, 0, 0, 1]
			}).packet;
			await serialPortHelper.sendMessage(initial);

			const message = new PacketConstructor(5, 13, {
				data: [
					{
						serial: 13,
						childCount: 1,
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
			await serialPortHelper.sendMessage(message2);
		};

		let getResults3 = async function() {
			let result = await client.exchange.nodeRepository.getAllNodes();

			if (result == null || result.length === 0)
				throw new Error("Empty result!");

			let cbb = result.filter(x => x.data.typeId === 3);
			let edd = result.filter(x => x.data.typeId === 4);
			expect(cbb[0].data.communicationStatus).to.equal(1); // communication status
			expect(edd[0].data.windowId).to.equal(2); // communication status
			expect(edd[0].data.delay).to.equal(3000); // communication status
			expect(cbb[0].data.loadCount).to.equal(0); // communication status
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
						childCount: 1,
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
						childCount: 2,
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
						childCount: 2,
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

		let getResults = async function() {
			await timer(3000);
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
			expect(cbb.data.childCount).to.equal(2); // communication status

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

	it("can process a change packet with CBBs and EDD Data 1 where  CBBs and EDD currently in database3", async function() {
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
						childCount: 1,
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
						childCount: 2,
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
						childCount: 2,
						ledState: 6,
						rawData: [0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 1, 0, 1, 1, 1]
					}
				]
			};

			const message4 = new PacketConstructor(5, 13, data6);
			await serialPortHelper.sendMessage(message4.packet);
		};

		let getResults = async function() {
			await timer(3000);
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
			expect(cbb.data.childCount).to.equal(2); // communication status
			expect(cbb.data.loadCount).to.equal(2); // communication status

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

	it("can turn off detonatorStatus in attached dets with a keyswitch off", async function() {
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
						childCount: 2,
						ledState: 6,
						rawData: [0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1]
					},
					{
						windowId: 2,
						rawData: [1, 1, 0, 0, 0, 1, 1, 1],
						delay: 2000
					}
				]
			};

			const message = new PacketConstructor(5, 13, data3);
			await serialPortHelper.sendMessage(message.packet);
		};

		let sendMessages2 = async function() {
			const data6a = {
				data: [
					{
						serial: 13,
						childCount: 2,
						ledState: 6,
						rawData: [0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 1, 0, 1, 1, 0]
					}
				]
			};

			const message4a = new PacketConstructor(5, 13, data6a);
			await serialPortHelper.sendMessage(message4a.packet);
		};

		let getResults1 = async function() {
			await timer(3000);
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
			expect(cbb.data.childCount).to.equal(2); // communication status
			expect(cbb.data.loadCount).to.equal(2); // communication status
			expect(edd1.data.detonatorStatus).to.equal(1); // communication status
		};

		let getResults = async function() {
			await timer(3000);
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

			console.log("RESULT", result);

			expect(cbb.data.communicationStatus).to.equal(1); // communication status
			expect(cbb.data.childCount).to.equal(2); // communication status
			expect(cbb.data.loadCount).to.equal(2); // communication status

			expect(edd1.data.detonatorStatus).to.equal(0); // communication status
		};

		let startTest = async function() {
			try {
				await sendMessages();
				await timer(1000);
				await getResults1();

				await sendMessages2();
				await timer(1000);

				await getResults();
			} catch (err) {
				return Promise.reject(err);
			}
		};

		return startTest();
	});

	it("edge case - will ignore an 05 packet where the serial is 255 and the windowID is 255", async function() {
		//this is an edge case where a packet comes in after and EDDSIG which has an EDD with
		//a delay of 255 and a windowID of 255

		//prior to new revision all 05 commands could write to db, so it was ignored.

		//item taken from cbb 115 - 27/05/2019
		//aaaa1005007300001828ff00ff001288

		//this fix is only applied in the data service after the EDDSIG
		const sendMessage = async () => {
			await serialPortHelper.sendMessage("aaaa1005007300001828ff00ff001288");
		};

		let checkResult = async () => {
			let result = await client.exchange.nodeRepository.getAllNodes();

			expect(result.length).to.eql(1);
			expect(result[0].data.childCount).to.eql(0);
		};

		let startTest = async () => {
			await sendMessage();
			await timer(1000);
			await checkResult();
		};

		return startTest();
	});
});
