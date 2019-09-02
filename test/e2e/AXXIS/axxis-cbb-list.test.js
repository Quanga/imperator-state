const chai = require("chai");
const expect = chai.expect;
chai.use(require("chai-match"));

const Mesh = require("happner-2");
const ServerHelper = require("../../helpers/server_helper");
const PacketConstructor = require("../../../lib/builders/packetConstructor");
const Queue = require("better-queue");

const util = require("../../helpers/utils");

describe("INTEGRATION - Units", async function() {
	this.timeout(25000);
	let serverHelper = new ServerHelper();
	var client;

	const sendQueue = new Queue((task, cb) => {
		setTimeout(() => {
			client.exchange.queueService.processIncoming(task.message).then(() => cb());
		}, task.wait);
	});

	context("CBB100 list test - 04 Command", async () => {
		before(async () => {
			await serverHelper.startServer("test");

			client = await new Mesh.MeshClient({
				secure: true,
				port: 55000
			});

			await util.asyncLogin(client);
		});

		beforeEach(async () => {
			await client.exchange.logsRepository.delete("*");
			await client.exchange.warningsRepository.delete("*");
			await client.exchange.nodeRepository.delete("*");
			await client.exchange.dataService.clearDataModel();

			sendQueue.push({
				message: {
					packet: new PacketConstructor(8, 8, {
						data: [0, 0, 0, 0, 0, 0, 0, 1]
					}).packet,
					createdAt: Date.now()
				},
				wait: 300
			});
		});

		after(async () => {
			client.disconnect();
			await serverHelper.stopServer();
		});

		it("will fail to add a packet if there is no data in the packet", async function() {
			sendQueue.push({
				message: {
					packet: new PacketConstructor(4, 12, {
						data: []
					}).packet,
					createdAt: Date.now()
				},
				wait: 300
			});

			await util.holdTillDrained(sendQueue);
			await util.timer(500);

			const result = await client.exchange.nodeRepository.getAllNodes();
			expect(result).to.be.instanceOf(Array);
			expect(result.length).to.be.greaterThan(0);

			let cbb = result.filter(x => parseInt(x.serial) === 12 && x.typeId === 3);
			expect(cbb.communicationStatus).to.be.undefined;
		});

		it("can process a packet with CBBs 1 and 2 EDDs where no CBBs currently in database", async function() {
			sendQueue.push({
				message: {
					packet: new PacketConstructor(4, 12, {
						data: [{ serial: 4423423, windowId: 33 }, { serial: 4523434, windowId: 34 }]
					}).packet,
					createdAt: Date.now()
				},
				wait: 300
			});

			await util.holdTillDrained(sendQueue);
			await util.timer(500);

			let result = await client.exchange.nodeRepository.getAllNodes();
			expect(result).to.be.instanceOf(Array);
			expect(result.length).to.be.greaterThan(3);

			const cbb = result.find(x => parseInt(x.serial) === 12 && x.typeId === 3);
			expect(cbb.communicationStatus).to.equal(1);

			const edd1 = result.find(x => parseInt(x.serial) === 4423423 && x.typeId === 4);
			expect(edd1.detonatorStatus).to.be.null;

			const edd2 = result.find(x => parseInt(x.serial) === 4523434 && x.typeId === 4);
			expect(edd2.detonatorStatus).to.be.null;
		});

		it("can process a second packet with CBBs 1 and 2 EDDs where two CBBs are currently in database", async function() {
			sendQueue.push({
				message: {
					packet: new PacketConstructor(4, 12, {
						data: [{ serial: 4423423, windowId: 33 }, { serial: 4523434, windowId: 34 }]
					}).packet,
					createdAt: Date.now()
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
					createdAt: Date.now()
				},
				wait: 300
			});
			await util.holdTillDrained(sendQueue);
			await util.timer(500);

			let result = await client.exchange.nodeRepository.getAllNodes();
			expect(result).to.be.instanceOf(Array);
			expect(result.length).to.be.greaterThan(3);

			const cbb = result.find(x => parseInt(x.serial) === 12 && x.typeId === 3);
			expect(cbb.communicationStatus).to.equal(1);

			const edd1 = result.find(x => parseInt(x.serial) === 4423423 && x.typeId === 4);
			expect(edd1.detonatorStatus).to.be.null;

			const edd2 = result.find(x => parseInt(x.serial) === 4523434 && x.typeId === 4);
			expect(edd2.detonatorStatus).to.be.null;
		});

		it("can process a third packet with CBBs 1 and 2 EDDs where two CBBs are currently in database", async function() {
			sendQueue.push({
				message: {
					packet: new PacketConstructor(4, 12, {
						data: [{ serial: 4423423, windowId: 33 }, { serial: 4523434, windowId: 34 }]
					}).packet,
					createdAt: Date.now()
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
					createdAt: Date.now()
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
					createdAt: Date.now()
				},
				wait: 300
			});

			await util.holdTillDrained(sendQueue);
			await util.timer(500);

			let result = await client.exchange.nodeRepository.getAllNodes();
			expect(result).to.be.instanceOf(Array);
			expect(result.length).to.be.greaterThan(3);

			const cbb = result.find(x => parseInt(x.serial) === 12 && x.typeId === 3);
			expect(cbb.communicationStatus).to.equal(1);

			const edd1 = result.find(x => parseInt(x.serial) === 4423423 && x.typeId === 4);
			expect(edd1.detonatorStatus).to.be.null;

			const edd2 = result.find(x => parseInt(x.serial) === 4523434 && x.typeId === 4);
			expect(edd2.detonatorStatus).to.be.null;
		});

		it("can handle a duplicate packet with CBBs 1 and 2 EDDs where two CBBs are currently in database", async function() {
			sendQueue.push({
				message: {
					packet: new PacketConstructor(4, 12, {
						data: [{ serial: 4423423, windowId: 33 }, { serial: 4523434, windowId: 34 }]
					}).packet,
					createdAt: Date.now()
				},
				wait: 300
			});

			sendQueue.push({
				message: {
					packet: new PacketConstructor(4, 12, {
						data: [{ serial: 4423423, windowId: 33 }, { serial: 4523434, windowId: 34 }]
					}).packet,
					createdAt: Date.now()
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
					createdAt: Date.now()
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
					createdAt: Date.now()
				},
				wait: 300
			});

			await util.holdTillDrained(sendQueue);
			await util.timer(500);

			const result = await client.exchange.nodeRepository.getAllNodes();
			expect(result).to.be.instanceOf(Array);
			expect(result.length).to.be.greaterThan(3);

			const cbb = result.find(x => parseInt(x.serial) === 12 && x.typeId === 3);
			expect(cbb.communicationStatus).to.equal(1);
			const edd1 = result.find(x => parseInt(x.serial) === 4423423 && x.typeId === 4);
			expect(edd1.detonatorStatus).to.null;
			const edd2 = result.find(x => parseInt(x.serial) === 4523434 && x.typeId === 4);
			expect(edd2.detonatorStatus).to.null;
		});

		it("can clear the list of edds from the database for a CBB", async function() {
			const { nodeRepository, dataService } = client.exchange;

			sendQueue.push({
				message: {
					packet: new PacketConstructor(4, 22, {
						data: [{ serial: 4423423, windowId: 1 }, { serial: 4523434, windowId: 2 }]
					}).packet,
					createdAt: Date.now()
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
					createdAt: Date.now()
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
					createdAt: Date.now()
				},
				wait: 300
			});

			await util.holdTillDrained(sendQueue);
			await util.timer(500);

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
					createdAt: Date.now()
				},
				wait: 300
			});

			await util.holdTillDrained(sendQueue);
			await util.timer(2000);

			resPersisted = await nodeRepository.getAllNodes();
			resData = await dataService.getSnapShot();

			mappedNodes = resPersisted.map(node => {
				return { node: node.constructor.name, data: node };
			});

			const cbb = mappedNodes.find(x => x.data.typeId === 3);
			expect(cbb.data.childCount).to.eql(0);

			expect(resData.units["22"].units.unitsCount).to.eql(0);
		});
	});
});
