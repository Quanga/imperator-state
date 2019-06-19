const expect = require("expect.js");
var Mesh = require("happner-2");
const ServerHelper = require("../../helpers/server_helper");
const PacketConstructor = require("../../../lib/builders/packetConstructor");
const Queue = require("better-queue");

describe("E2E - AXXIS - CBB list test", async function() {
	this.timeout(25000);
	let serverHelper = new ServerHelper();
	var client;

	const sendQueue = new Queue((task, cb) => {
		setTimeout(() => {
			client.exchange.queueService.addToQueue(task.message);
			cb();
		}, task.wait);
	});

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
			await serverHelper.startServer();
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
		await client.exchange.archiveRepository.delete("*");

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
		await timer(2000);
	});

	it("can process a packet with CBBs 1 where no CBBs currently in database", async function() {
		let sendMessages = async function() {
			sendQueue.push({
				message: {
					packet: new PacketConstructor(4, 12, {
						data: []
					}).packet,
					created: Date.now()
				},
				wait: 300
			});
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
			sendQueue.push({
				message: {
					packet: new PacketConstructor(4, 12, {
						data: [
							{ serial: 4423423, windowId: 33 },
							{ serial: 4523434, windowId: 34 }
						]
					}).packet,
					created: Date.now()
				},
				wait: 300
			});
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
			sendQueue.push({
				message: {
					packet: new PacketConstructor(4, 12, {
						data: [
							{ serial: 4423423, windowId: 33 },
							{ serial: 4523434, windowId: 34 }
						]
					}).packet,
					created: Date.now()
				},
				wait: 300
			});

			sendQueue.push({
				message: {
					packet: new PacketConstructor(4, 12, {
						data: [
							{ serial: 4423425, windowId: 35 },
							{ serial: 4523436, windowId: 36 },
							{ serial: 4523437, windowId: 37 }
						]
					}).packet,
					created: Date.now()
				},
				wait: 300
			});
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

			expect(cbb.data.communicationStatus).to.equal(1); // communication status
			//expect(cbb.data.loadCount).to.equal(5); // det loaded

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
			sendQueue.push({
				message: {
					packet: new PacketConstructor(4, 12, {
						data: [
							{ serial: 4423423, windowId: 33 },
							{ serial: 4523434, windowId: 34 }
						]
					}).packet,
					created: Date.now()
				},
				wait: 300
			});

			sendQueue.push({
				message: {
					packet: new PacketConstructor(4, 12, {
						data: [
							{ serial: 4423425, windowId: 35 },
							{ serial: 4523436, windowId: 36 },
							{ serial: 4523437, windowId: 37 }
						]
					}).packet,
					created: Date.now()
				},
				wait: 300
			});

			sendQueue.push({
				message: {
					packet: new PacketConstructor(4, 12, {
						data: [
							{ serial: 4423428, windowId: 38 },
							{ serial: 4523439, windowId: 39 },
							{ serial: 4523469, windowId: 40 }
						]
					}).packet,
					created: Date.now()
				},
				wait: 300
			});
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

			expect(cbb.data.communicationStatus).to.equal(1); // communication status
			//expect(cbb.data.loadCount).to.equal(8); // det loaded

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
			sendQueue.push({
				message: {
					packet: new PacketConstructor(4, 12, {
						data: [
							{ serial: 4423423, windowId: 33 },
							{ serial: 4523434, windowId: 34 }
						]
					}).packet,
					created: Date.now()
				},
				wait: 300
			});

			sendQueue.push({
				message: {
					packet: new PacketConstructor(4, 12, {
						data: [
							{ serial: 4423423, windowId: 33 },
							{ serial: 4523434, windowId: 34 }
						]
					}).packet,
					created: Date.now()
				},
				wait: 300
			});

			sendQueue.push({
				message: {
					packet: new PacketConstructor(4, 12, {
						data: [
							{ serial: 4423425, windowId: 35 },
							{ serial: 4523436, windowId: 36 },
							{ serial: 4523437, windowId: 37 }
						]
					}).packet,
					created: Date.now()
				},
				wait: 300
			});

			sendQueue.push({
				message: {
					packet: new PacketConstructor(4, 12, {
						data: [
							{ serial: 4423428, windowId: 38 },
							{ serial: 4523439, windowId: 39 },
							{ serial: 4523469, windowId: 40 }
						]
					}).packet,
					created: Date.now()
				},
				wait: 300
			});
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

			expect(cbb.data.communicationStatus).to.equal(1); // communication status
			//expect(cbb.data.loadCount).to.equal(8); // det loaded

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
			sendQueue.push({
				message: {
					packet: new PacketConstructor(4, 22, {
						data: [
							{ serial: 4423423, windowId: 1 },
							{ serial: 4523434, windowId: 2 }
						]
					}).packet,
					created: Date.now()
				},
				wait: 300
			});

			sendQueue.push({
				message: {
					packet: new PacketConstructor(5, 22, {
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
					}).packet,
					created: Date.now()
				},
				wait: 300
			});

			sendQueue.push({
				message: {
					packet: new PacketConstructor(5, 22, {
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
					}).packet,
					created: Date.now()
				},
				wait: 300
			});
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
			sendQueue.push({
				message: {
					packet: new PacketConstructor(4, 22, {
						data: [{ serial: 4294967295, windowId: 1 }]
					}).packet,
					created: Date.now()
				},
				wait: 300
			});
		};

		const checkFinalResults = async () => {
			const allNodes = await nodeRepository.getAllNodes();
			const mappedNodes = allNodes.map(node => {
				return { node: node.constructor.name, data: node.data };
			});

			const cbb = mappedNodes.filter(x => x.data.typeId === 3);
			expect(cbb.length).to.eql(1);
			expect(cbb[0].data.childCount).to.eql(0);
			//expect(cbb[0].data.loadCount).to.eql(0);

			const archives = await archiveRepository.getAll();
			//console.log("ARCHIVES", JSON.stringify(archives, null, 2));

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
