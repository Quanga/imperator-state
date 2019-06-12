const expect = require("expect.js");
var Mesh = require("happner-2");
const ServerHelper = require("../../helpers/server_helper");
const SerialPortHelper = require("../../helpers/serial_port_helper");
const PacketConstructor = require("../../../lib/builders/packetConstructor");

describe("E2E - AXXIS - CBB list test", async function() {
	const serialPortHelper = new SerialPortHelper();
	let serverHelper = new ServerHelper();

	var client;

	this.timeout(20000);

	let timer = ms => {
		return new Promise(resolve => setTimeout(resolve, ms));
	};

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
			await client.exchange.archiveRepository.deleteAll();
		}
	);

	after("stop test server", async function() {
		client.disconnect();
		await serverHelper.stopServer();
		await serialPortHelper.destroy();
		await timer(2000);
	});

	it("can process a packet with CBBs 1 where no CBBs currently in database", async function() {
		let sendMessages = async function() {
			const initial = new PacketConstructor(8, 8, {
				data: [0, 0, 0, 0, 0, 0, 0, 1]
			});
			await serialPortHelper.sendMessage(initial.packet);

			const message = new PacketConstructor(4, 12, { data: [] });
			await serialPortHelper.sendMessage(message.packet);
		};

		let getResults = async function() {
			let result = await client.exchange.nodeRepository.getAllNodes();

			if (result == null || result.length == 0)
				throw new Error("Empty result!");

			let cbb = null;

			result.forEach(x => {
				if (parseInt(x.data.serial) === 12 && x.data.typeId === 3) cbb = x;
			});

			expect(cbb.data.communicationStatus).to.equal(1); // communication status
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

	it("can process a packet with CBBs 1 and 2 EDDs where no CBBs currently in database", async function() {
		let sendMessages = async function() {
			const initial = new PacketConstructor(8, 8, {
				data: [0, 0, 0, 0, 0, 0, 0, 1]
			});
			await serialPortHelper.sendMessage(initial.packet);

			const data2 = {
				data: [
					{ serial: 4423423, windowId: 33 },
					{ serial: 4523434, windowId: 34 }
				]
			};

			const message = new PacketConstructor(4, 12, data2);
			await serialPortHelper.sendMessage(message.packet);
		};

		let getResults = async function() {
			let result = await client.exchange.nodeRepository.getAllNodes();
			if (result == null || result.length == 0)
				throw new Error("Empty result!");

			let cbb = null,
				edd1 = null,
				edd2 = null;

			await result.forEach(x => {
				if (parseInt(x.data.serial) === 12 && x.data.typeId === 3) cbb = x;
				if (parseInt(x.data.serial) === 4423423 && x.data.typeId === 4)
					edd1 = x;
				if (parseInt(x.data.serial) === 4523434 && x.data.typeId === 4)
					edd2 = x;
			});

			expect(cbb.data.communicationStatus).to.equal(1); // communication status
			expect(cbb.data.loadCount).to.equal(2); // det status
			expect(edd1.data.detonatorStatus).to.equal(null); // det status
			expect(edd2.data.detonatorStatus).to.equal(null); // det status
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

	it("can process a second packet with CBBs 1 and 2 EDDs where two CBBs are currently in database", async function() {
		let sendMessages = async function() {
			const initial = new PacketConstructor(8, 8, {
				data: [0, 0, 0, 0, 0, 0, 0, 1]
			});
			await serialPortHelper.sendMessage(initial.packet);

			const data2 = {
				data: [
					{ serial: 4423423, windowId: 33 },
					{ serial: 4523434, windowId: 34 }
				]
			};

			const message = new PacketConstructor(4, 12, data2);
			await serialPortHelper.sendMessage(message.packet);

			const data3 = {
				data: [
					{ serial: 4423425, windowId: 35 },
					{ serial: 4523436, windowId: 36 },
					{ serial: 4523437, windowId: 37 }
				]
			};

			const message3 = new PacketConstructor(4, 12, data3);
			await serialPortHelper.sendMessage(message3.packet);
		};

		let getResults = async function() {
			await timer(2000);
			let result = await client.exchange.nodeRepository.getAllNodes();
			if (result == null || result.length == 0)
				throw new Error("Empty result!");

			let cbb = null,
				edd1 = null,
				edd2 = null;

			await result.forEach(x => {
				if (parseInt(x.data.serial) === 12 && x.data.typeId === 3) cbb = x;
				if (parseInt(x.data.serial) === 4423423 && x.data.typeId === 4)
					edd1 = x;
				if (parseInt(x.data.serial) === 4523434 && x.data.typeId === 4)
					edd2 = x;
			});

			console.log(cbb);
			expect(cbb.data.communicationStatus).to.equal(1); // communication status
			expect(cbb.data.loadCount).to.equal(5); // det loaded

			expect(edd1.data.detonatorStatus).to.equal(null); // det status
			expect(edd2.data.detonatorStatus).to.equal(null); // det status
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

	it("can process a third packet with CBBs 1 and 2 EDDs where two CBBs are currently in database", async function() {
		let sendMessages = async function() {
			const initial = new PacketConstructor(8, 8, {
				data: [0, 0, 0, 0, 0, 0, 0, 1]
			});
			await serialPortHelper.sendMessage(initial.packet);

			const data2 = {
				data: [
					{ serial: 4423423, windowId: 33 },
					{ serial: 4523434, windowId: 34 }
				]
			};

			const message = new PacketConstructor(4, 12, data2);
			await serialPortHelper.sendMessage(message.packet);

			const data3 = {
				data: [
					{ serial: 4423425, windowId: 35 },
					{ serial: 4523436, windowId: 36 },
					{ serial: 4523437, windowId: 37 }
				]
			};

			const message3 = new PacketConstructor(4, 12, data3);
			await serialPortHelper.sendMessage(message3.packet);

			const data4 = {
				data: [
					{ serial: 4423428, windowId: 38 },
					{ serial: 4523439, windowId: 39 },
					{ serial: 4523469, windowId: 40 }
				]
			};

			const message4 = new PacketConstructor(4, 12, data4);
			await serialPortHelper.sendMessage(message4.packet);
		};

		let getResults = async function() {
			await timer(2000);
			let result = await client.exchange.nodeRepository.getAllNodes();
			if (result == null || result.length == 0)
				throw new Error("Empty result!");

			let cbb = null,
				edd1 = null,
				edd2 = null;

			await result.forEach(x => {
				if (parseInt(x.data.serial) === 12 && x.data.typeId === 3) cbb = x;
				if (parseInt(x.data.serial) === 4423423 && x.data.typeId === 4)
					edd1 = x;
				if (parseInt(x.data.serial) === 4523434 && x.data.typeId === 4)
					edd2 = x;
			});

			console.log(cbb);
			expect(cbb.data.communicationStatus).to.equal(1); // communication status
			expect(cbb.data.loadCount).to.equal(8); // det loaded

			expect(edd1.data.detonatorStatus).to.equal(null); // det status
			expect(edd2.data.detonatorStatus).to.equal(null); // det status
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

	it("can handle a duplicate packet with CBBs 1 and 2 EDDs where two CBBs are currently in database", async function() {
		let sendMessages = async function() {
			const initial = new PacketConstructor(8, 8, {
				data: [0, 0, 0, 0, 0, 0, 0, 1]
			});
			await serialPortHelper.sendMessage(initial.packet);

			const data2 = {
				data: [
					{ serial: 4423423, windowId: 33 },
					{ serial: 4523434, windowId: 34 }
				]
			};

			const message = new PacketConstructor(4, 12, data2);
			await serialPortHelper.sendMessage(message.packet);

			const datadup = {
				data: [
					{ serial: 4423423, windowId: 33 },
					{ serial: 4523434, windowId: 34 }
				]
			};

			const messagedup = new PacketConstructor(4, 12, datadup);
			await serialPortHelper.sendMessage(messagedup.packet);

			const data3 = {
				data: [
					{ serial: 4423425, windowId: 35 },
					{ serial: 4523436, windowId: 36 },
					{ serial: 4523437, windowId: 37 }
				]
			};

			const message3 = new PacketConstructor(4, 12, data3);
			await serialPortHelper.sendMessage(message3.packet);

			const data4 = {
				data: [
					{ serial: 4423428, windowId: 38 },
					{ serial: 4523439, windowId: 39 },
					{ serial: 4523469, windowId: 40 }
				]
			};

			const message4 = new PacketConstructor(4, 12, data4);
			await serialPortHelper.sendMessage(message4.packet);
		};

		let getResults = async function() {
			await timer(2000);
			let result = await client.exchange.nodeRepository.getAllNodes();
			if (result == null || result.length == 0)
				throw new Error("Empty result!");

			let cbb = null,
				edd1 = null,
				edd2 = null;

			await result.forEach(x => {
				if (parseInt(x.data.serial) === 12 && x.data.typeId === 3) cbb = x;
				if (parseInt(x.data.serial) === 4423423 && x.data.typeId === 4)
					edd1 = x;
				if (parseInt(x.data.serial) === 4523434 && x.data.typeId === 4)
					edd2 = x;
			});

			//console.log(cbb);
			expect(cbb.data.communicationStatus).to.equal(1); // communication status
			expect(cbb.data.loadCount).to.equal(8); // det loaded

			expect(edd1.data.detonatorStatus).to.equal(null); // det status
			expect(edd2.data.detonatorStatus).to.equal(null); // det status
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

	it("can clear the list of edds from the database for a CBB", async function() {
		const { nodeRepository, archiveRepository } = client.exchange;

		let loadMessages = async function() {
			const initial = new PacketConstructor(8, 12, {
				data: [0, 0, 0, 0, 0, 0, 0, 1]
			});
			await serialPortHelper.sendMessage(initial.packet);

			const data2 = {
				data: [
					{ serial: 4423423, windowId: 1 },
					{ serial: 4523434, windowId: 2 }
				]
			};

			const initial2 = new PacketConstructor(4, 22, data2);
			await serialPortHelper.sendMessage(initial2.packet);

			const data3 = {
				data: [
					{
						serial: 22,
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
			};

			const message = new PacketConstructor(5, 22, data3);
			await serialPortHelper.sendMessage(message.packet);

			const message2 = new PacketConstructor(5, 22, {
				data: [
					{
						serial: 22,
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
			});
			await serialPortHelper.sendMessage(message2.packet);
		};

		const checkLoaded = async () => {
			//check all the items are loaded correctly in the system
			const allNodes = await nodeRepository.getAllNodes();
			const mappedNodes = allNodes.map(node => {
				return { node: node.constructor.name, data: node.data };
			});
			expect(mappedNodes.length).to.eql(4);
		};

		const sendClearSignal = async () => {
			const data5 = {
				data: [{ serial: 4294967295, windowId: 1 }]
			};

			const clearPacket = new PacketConstructor(4, 22, data5);
			await serialPortHelper.sendMessage(clearPacket.packet);
		};

		const checkFinalResults = async () => {
			const allNodes = await nodeRepository.getAllNodes();
			const mappedNodes = allNodes.map(node => {
				return { node: node.constructor.name, data: node.data };
			});

			const cbb = mappedNodes.filter(x => x.data.typeId === 3);
			expect(cbb.length).to.eql(1);
			expect(cbb[0].data.childCount).to.eql(0);
			expect(cbb[0].data.loadCount).to.eql(0);

			const archives = await archiveRepository.getAll();
			console.log("ARCHIVES", JSON.stringify(archives, null, 2));

			expect(archives[0].value.length).to.eql(2);
		};

		let startTest = async function() {
			try {
				await loadMessages();
				await timer(2000);
				await checkLoaded();
				await sendClearSignal();
				await timer(2000);
				await checkFinalResults();
			} catch (err) {
				return Promise.reject(err);
			}
		};

		return startTest();
	});
});
