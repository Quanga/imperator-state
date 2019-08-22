const chai = require("chai");
const expect = chai.expect;
chai.use(require("chai-match"));

const Mesh = require("happner-2");
const ServerHelper = require("../../helpers/server_helper");
const PacketConstructor = require("../../../lib/builders/packetConstructor");
const Queue = require("better-queue");

describe("INTEGRATION - Units", async function() {
	this.timeout(25000);
	let serverHelper = new ServerHelper();
	var client;

	const sendQueue = new Queue((task, cb) => {
		setTimeout(() => {
			client.exchange.queueService.processIncoming(task.message);
			cb();
		}, task.wait);
	});

	let timer = ms => {
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

	context("CBB100 list test - 04 Command", async () => {
		before(async () => {
			try {
				await serverHelper.startServer();
				await AsyncLogin();
			} catch (err) {
				return Promise.reject(err);
			}
		});

		beforeEach(async () => {
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

		after(async () => {
			client.disconnect();
			await serverHelper.stopServer();
		});

		it("can process a packet with CBBs 1 where no CBBs currently in database", async function() {
			sendQueue.push({
				message: {
					packet: new PacketConstructor(4, 12, {
						data: []
					}).packet,
					created: Date.now()
				},
				wait: 300
			});

			await holdAsync();
			await timer(1000);

			let result = await client.exchange.nodeRepository.getAllNodes();

			if (result == null || result.length == 0) throw new Error("Empty result!");

			let cbb = null;

			result.forEach(x => {
				if (parseInt(x.serial) === 12 && x.typeId === 3) cbb = x;
			});

			expect(cbb.communicationStatus).to.equal(1);
		});

		it("can process a packet with CBBs 1 and 2 EDDs where no CBBs currently in database", async function() {
			sendQueue.push({
				message: {
					packet: new PacketConstructor(4, 12, {
						data: [{ serial: 4423423, windowId: 33 }, { serial: 4523434, windowId: 34 }]
					}).packet,
					created: Date.now()
				},
				wait: 300
			});

			await holdAsync();
			await timer(1000);

			let result = await client.exchange.nodeRepository.getAllNodes();
			if (result == null || result.length == 0) throw new Error("Empty result!");

			let cbb = null,
				edd1 = null,
				edd2 = null;

			await result.forEach(x => {
				if (parseInt(x.serial) === 12 && x.typeId === 3) cbb = x;
				if (parseInt(x.serial) === 4423423 && x.typeId === 4) edd1 = x;
				if (parseInt(x.serial) === 4523434 && x.typeId === 4) edd2 = x;
			});

			expect(cbb.communicationStatus).to.equal(1);
			expect(edd1.detonatorStatus).to.equal(0);
			expect(edd2.detonatorStatus).to.equal(0);
		});

		it("can process a second packet with CBBs 1 and 2 EDDs where two CBBs are currently in database", async function() {
			sendQueue.push({
				message: {
					packet: new PacketConstructor(4, 12, {
						data: [{ serial: 4423423, windowId: 33 }, { serial: 4523434, windowId: 34 }]
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
			await holdAsync();
			await timer(1000);

			let result = await client.exchange.nodeRepository.getAllNodes();
			if (result == null || result.length == 0) throw new Error("Empty result!");

			let cbb = null,
				edd1 = null,
				edd2 = null;

			await result.forEach(x => {
				if (parseInt(x.serial) === 12 && x.typeId === 3) cbb = x;
				if (parseInt(x.serial) === 4423423 && x.typeId === 4) edd1 = x;
				if (parseInt(x.serial) === 4523434 && x.typeId === 4) edd2 = x;
			});

			expect(cbb.communicationStatus).to.equal(1);
			expect(edd1.detonatorStatus).to.equal(0);
			expect(edd2.detonatorStatus).to.equal(0);
		});

		it("can process a third packet with CBBs 1 and 2 EDDs where two CBBs are currently in database", async function() {
			sendQueue.push({
				message: {
					packet: new PacketConstructor(4, 12, {
						data: [{ serial: 4423423, windowId: 33 }, { serial: 4523434, windowId: 34 }]
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

			await holdAsync();
			await timer(1000);

			let result = await client.exchange.nodeRepository.getAllNodes();
			if (result == null || result.length == 0) throw new Error("Empty result!");

			let cbb = null,
				edd1 = null,
				edd2 = null;

			await result.forEach(x => {
				if (parseInt(x.serial) === 12 && x.typeId === 3) cbb = x;
				if (parseInt(x.serial) === 4423423 && x.typeId === 4) edd1 = x;
				if (parseInt(x.serial) === 4523434 && x.typeId === 4) edd2 = x;
			});

			expect(cbb.communicationStatus).to.equal(1);
			expect(edd1.detonatorStatus).to.equal(0);
			expect(edd2.detonatorStatus).to.equal(0);
		});

		it("can handle a duplicate packet with CBBs 1 and 2 EDDs where two CBBs are currently in database", async function() {
			sendQueue.push({
				message: {
					packet: new PacketConstructor(4, 12, {
						data: [{ serial: 4423423, windowId: 33 }, { serial: 4523434, windowId: 34 }]
					}).packet,
					created: Date.now()
				},
				wait: 300
			});

			sendQueue.push({
				message: {
					packet: new PacketConstructor(4, 12, {
						data: [{ serial: 4423423, windowId: 33 }, { serial: 4523434, windowId: 34 }]
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

			await holdAsync();
			await timer(1000);

			let resPersist = await client.exchange.nodeRepository.getAllNodes();
			if (resPersist == null || resPersist.length == 0) throw new Error("Empty resPersist!");

			let cbb = null,
				edd1 = null,
				edd2 = null;

			await resPersist.forEach(x => {
				if (parseInt(x.serial) === 12 && x.typeId === 3) cbb = x;
				if (parseInt(x.serial) === 4423423 && x.typeId === 4) edd1 = x;
				if (parseInt(x.serial) === 4523434 && x.typeId === 4) edd2 = x;
			});

			expect(cbb.communicationStatus).to.equal(1);
			expect(edd1.detonatorStatus).to.equal(0);
			expect(edd2.detonatorStatus).to.equal(0);
		});

		it("can clear the list of edds from the database for a CBB", async function() {
			const { nodeRepository, dataService } = client.exchange;

			sendQueue.push({
				message: {
					packet: new PacketConstructor(4, 22, {
						data: [{ serial: 4423423, windowId: 1 }, { serial: 4523434, windowId: 2 }]
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

			await holdAsync();
			await timer(1000);

			let resPersisted = await nodeRepository.getAllNodes();
			let resData = await dataService.getSnapShot();

			let mappedNodes = resPersisted.map(node => {
				return { node: node.constructor.name, data: node.data };
			});

			expect(resData.units["22"].units.unitsCount).to.eql(2);
			expect(mappedNodes.length).to.eql(4);

			sendQueue.push({
				message: {
					packet: new PacketConstructor(4, 22, {
						data: [{ serial: 4294967295, windowId: 1 }]
					}).packet,
					created: Date.now()
				},
				wait: 300
			});

			await holdAsync();
			await timer(1000);

			resPersisted = await nodeRepository.getAllNodes();
			resData = await dataService.getSnapShot();

			mappedNodes = resPersisted.map(node => {
				return { node: node.constructor.name, data: node };
			});

			const cbb = mappedNodes.filter(x => x.data.typeId === 3);
			expect(cbb.length).to.eql(1);
			expect(cbb[0].data.childCount).to.eql(0);

			expect(resData.units["22"].units.unitsCount).to.eql(0);
		});
	});
});
