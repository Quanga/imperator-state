const chai = require("chai");
const expect = chai.expect;
chai.use(require("chai-match"));

const Mesh = require("happner-2");
const ServerHelper = require("../../helpers/server_helper");
const PktBldr = require("imperator-packet-constructor");
const Queue = require("better-queue");

const util = require("../../helpers/utils");

const fields = require("../../../lib/configs/fields/fieldConstants");
const { serial, typeId, childCount, communicationStatus } = fields;
const IntToIP = require("ip-to-int");

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
				port: 55000,
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
					packet: PktBldr.withCommand(8)
						.withParent(8)
						.withData([0, 0, 0, 0, 0, 0, 0, 1])
						.build(),
					createdAt: Date.now(),
				},
				wait: 300,
			});
		});

		after(async () => {
			client.disconnect();
			await serverHelper.stopServer();
		});

		it("can process a packet with CBBs 1 and 2 EDDs where no CBBs currently in database", async function() {
			sendQueue.push({
				message: {
					packet: PktBldr.withCommand(8)
						.withParent(8)
						.withData([0, 0, 0, 0, 0, 0, 0, 1])
						.build(),
					createdAt: Date.now(),
				},
				wait: 300,
			});

			sendQueue.push({
				message: {
					packet: PktBldr.withCommand(4)
						.withParent(12)
						.withData([
							{ serial: 4423423, windowId: 33 },
							{ serial: 4523434, windowId: 34 },
						])
						.build(),
					createdAt: Date.now(),
				},
				wait: 300,
			});

			await util.holdTillDrained(sendQueue);
			await util.timer(1000);

			let result = await client.exchange.nodeRepository.get("*");
			expect(result).to.be.instanceOf(Array);
			expect(result.length).to.be.greaterThan(3);

			const cbb = result.find(x => x.meta[serial] === 12 && x.meta[typeId] === 3);
			expect(cbb.state[communicationStatus]).to.equal(1);

			const edd1 = result.find(
				x => x.meta[serial] === IntToIP(4423423).toIP() && x.meta[typeId] === 4,
			);
			expect(edd1.state[communicationStatus]).to.be.equal(0);

			const edd2 = result.find(
				x => x.meta[serial] === IntToIP(4523434).toIP() && x.meta[typeId] === 4,
			);
			expect(edd2.state[communicationStatus]).to.be.equal(0);
		});

		it("can process a second packet with CBBs 1 and 2 EDDs where two CBBs are currently in database", async function() {
			sendQueue.push({
				message: {
					packet: PktBldr.withCommand(4)
						.withParent(12)
						.withData([
							{ serial: 4423423, windowId: 33 },
							{ serial: 4523434, windowId: 34 },
						])
						.build(),
					createdAt: Date.now(),
				},
				wait: 300,
			});

			sendQueue.push({
				message: {
					packet: PktBldr.withCommand(4)
						.withParent(12)
						.withData([
							{ serial: 4423425, windowId: 35 },
							{ serial: 4523436, windowId: 36 },
							{ serial: 4523437, windowId: 37 },
						])
						.build(),
					createdAt: Date.now(),
				},
				wait: 300,
			});
			await util.holdTillDrained(sendQueue);
			await util.timer(500);

			let result = await client.exchange.nodeRepository.get("*");
			expect(result).to.be.instanceOf(Array);
			expect(result.length).to.be.greaterThan(3);

			const cbb = result.find(x => x.meta[serial] === 12 && x.meta[typeId] === 3);
			expect(cbb.state[communicationStatus]).to.equal(1);

			const edd1 = result.find(
				x => x.meta[serial] === IntToIP(4423423).toIP() && x.meta[typeId] === 4,
			);
			expect(edd1.state[communicationStatus]).to.be.equal(0);

			const edd2 = result.find(
				x => x.meta[serial] === IntToIP(4523434).toIP() && x.meta[typeId] === 4,
			);
			expect(edd2.state[communicationStatus]).to.be.equal(0);
		});

		it("can process a third packet with CBBs 1 and 2 EDDs where two CBBs are currently in database", async function() {
			sendQueue.push({
				message: {
					packet: PktBldr.withCommand(4)
						.withParent(12)
						.withData([
							{ serial: 4423423, windowId: 33 },
							{ serial: 4523434, windowId: 34 },
						])
						.build(),
					createdAt: Date.now(),
				},
				wait: 300,
			});

			sendQueue.push({
				message: {
					packet: PktBldr.withCommand(4)
						.withParent(12)
						.withData([
							{ serial: 4423425, windowId: 35 },
							{ serial: 4523436, windowId: 36 },
							{ serial: 4523437, windowId: 37 },
						])
						.build(),
					createdAt: Date.now(),
				},
				wait: 300,
			});

			sendQueue.push({
				message: {
					packet: PktBldr.withCommand(4)
						.withParent(12)
						.withData([
							{ serial: 4423428, windowId: 38 },
							{ serial: 4523439, windowId: 39 },
							{ serial: 4523469, windowId: 40 },
						])
						.build(),
					createdAt: Date.now(),
				},
				wait: 300,
			});

			await util.holdTillDrained(sendQueue);
			await util.timer(500);

			let result = await client.exchange.nodeRepository.get("*");
			expect(result).to.be.instanceOf(Array);
			expect(result.length).to.be.greaterThan(3);

			const cbb = result.find(x => x.meta[serial] === 12 && x.meta[typeId] === 3);
			expect(cbb.state[communicationStatus]).to.equal(1);

			const edd1 = result.find(
				x => x.meta[serial] === IntToIP(4423423).toIP() && x.meta[typeId] === 4,
			);
			expect(edd1.state[communicationStatus]).to.be.equal(0);

			const edd2 = result.find(
				x => x.meta[serial] === IntToIP(4523434).toIP() && x.meta[typeId] === 4,
			);
			expect(edd2.state[communicationStatus]).to.be.equal(0);
		});

		it("can handle a duplicate packet with CBBs 1 and 2 EDDs where two CBBs are currently in database", async function() {
			sendQueue.push({
				message: {
					packet: PktBldr.withCommand(4)
						.withParent(12)
						.withData([
							{ serial: 4423423, windowId: 33 },
							{ serial: 4523434, windowId: 34 },
						])
						.build(),
					createdAt: Date.now(),
				},
				wait: 300,
			});

			sendQueue.push({
				message: {
					packet: PktBldr.withCommand(4)
						.withParent(12)
						.withData([
							{ serial: 4423423, windowId: 33 },
							{ serial: 4523434, windowId: 34 },
						])
						.build(),
					createdAt: Date.now(),
				},
				wait: 300,
			});

			sendQueue.push({
				message: {
					packet: PktBldr.withCommand(4)
						.withParent(12)
						.withData([
							{ serial: 4423425, windowId: 35 },
							{ serial: 4523436, windowId: 36 },
							{ serial: 4523437, windowId: 37 },
						])
						.build(),
					createdAt: Date.now(),
				},
				wait: 300,
			});

			sendQueue.push({
				message: {
					packet: PktBldr.withCommand(4)
						.withParent(12)
						.withData([
							{ serial: 4423428, windowId: 38 },
							{ serial: 4523439, windowId: 39 },
							{ serial: 4523469, windowId: 40 },
						])
						.build(),
					createdAt: Date.now(),
				},
				wait: 300,
			});

			await util.holdTillDrained(sendQueue);
			await util.timer(500);

			const result = await client.exchange.nodeRepository.get("*");
			expect(result).to.be.instanceOf(Array);
			expect(result.length).to.be.greaterThan(3);

			const cbb = result.find(x => x.meta[serial] === 12 && x.meta[typeId] === 3);
			expect(cbb.state[communicationStatus]).to.equal(1);
			const edd1 = result.find(
				x => x.meta[serial] === IntToIP(4423423).toIP() && x.meta[typeId] === 4,
			);
			expect(edd1.state[communicationStatus]).to.be.equal(0);
			const edd2 = result.find(
				x => x.meta[serial] === IntToIP(4523434).toIP() && x.meta[typeId] === 4,
			);
			expect(edd2.state[communicationStatus]).to.be.equal(0);
		});

		it("can clear the list of edds from the database for a CBB", async function() {
			const { nodeRepository, dataService } = client.exchange;

			sendQueue.push({
				message: {
					packet: PktBldr.withCommand(4)
						.withParent(22)
						.withData([
							{ serial: 4423423, windowId: 1 },
							{ serial: 4523434, windowId: 2 },
						])
						.build(),
					createdAt: Date.now(),
				},
				wait: 300,
			});

			sendQueue.push({
				message: {
					packet: PktBldr.withCommand(5)
						.withParent(22)
						.withData([
							{
								serial: 22,
								childCount: 2,
								ledState: 6,
								rawData: [0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1],
							},
							{
								windowId: 2,
								rawData: [1, 0, 1, 1, 1, 1, 1],
								delay: 2000,
							},
						])
						.build(),
					createdAt: Date.now(),
				},
				wait: 300,
			});

			sendQueue.push({
				message: {
					packet: PktBldr.withCommand(5)
						.withParent(22)
						.withData([
							{
								serial: 22,
								childCount: 2,
								ledState: 6,
								rawData: [0, 1, 0, 0, 1, 0, 0, 0, 1, 1, 1],
							},
							{
								windowId: 1,
								rawData: [1, 1, 1, 1, 1, 1, 1],
								delay: 3000,
							},
						])
						.build(),
					createdAt: Date.now(),
				},
				wait: 300,
			});

			await util.holdTillDrained(sendQueue);
			await util.timer(1000);

			let resPersisted = await nodeRepository.get("*");
			let resData = await dataService.getSnapShot();

			let mappedNodes = resPersisted.map(node => {
				return { node: node.constructor.name, data: node.data };
			});
			console.log(JSON.stringify(resData[3]["22"], null, 2));
			expect(resData[3]["22"].children[4].length).to.eql(2);
			expect(mappedNodes.length).to.eql(4);

			sendQueue.push({
				message: {
					packet: PktBldr.withCommand(4)
						.withParent(22)
						.withData([{ serial: 4294967295, windowId: 1 }])
						.build(),
					createdAt: Date.now(),
				},
				wait: 300,
			});

			await util.holdTillDrained(sendQueue);
			await util.timer(2000);

			resPersisted = await nodeRepository.get("*");
			resData = await dataService.getSnapShot();

			mappedNodes = resPersisted.map(node => {
				return { node: node.constructor.name, data: node.data, meta: node.meta };
			});

			const cbb = mappedNodes.find(x => x.meta[typeId] === 3);
			expect(cbb.data[childCount]).to.eql(0);

			expect(resData[3]["22"].children[4].length).to.eql(0);
		});
	});
});
