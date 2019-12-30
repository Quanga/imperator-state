const chai = require("chai");
const expect = chai.expect;
chai.use(require("chai-match"));

const ServerHelper = require("../../helpers/server_helper");
const PktBldr = require("imperator-packet-constructor");
const Queue = require("better-queue");
const Mesh = require("happner-2");

const util = require("../../helpers/utils");
const fields = require("../../../lib/configs/fields/fieldConstants");
const { typeId, serial, communicationStatus, childCount } = fields;
const { windowId, delay, keySwitchStatus } = fields;
const IntToIP = require("ip-to-int");

describe("INTEGRATION - Units", async function() {
	this.timeout(15000);
	let serverHelper = new ServerHelper();
	let client;

	const sendQueue = new Queue((task, cb) => {
		setTimeout(() => {
			client.exchange.queueService.processIncoming(task.message);
			cb();
		}, task.wait);
	});

	context("CBB100 data test - 05 Command", async () => {
		const createdAt = Date.now();

		before(async () => {
			await serverHelper.startServer("test");

			client = await new Mesh.MeshClient({
				secure: true,
				port: 55000,
			});
			await util.asyncLogin(client);
		});

		beforeEach("delete all current nodes, logs, warnings", async function() {
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
					createdAt,
				},
				wait: 600,
			});
		});

		after("stop test server", async function() {
			client.disconnect();
			await serverHelper.stopServer();
		});

		it("can process a packet with CBBs Data 1 where no CBBs are currently in database", async () => {
			sendQueue.push({
				message: {
					packet: PktBldr.withCommand(5)
						.withParent(13)
						.withData([
							{
								serial: 13,
								childCount: 0,
								ledState: 6,
								rawData: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
							},
						])
						.build(),
					createdAt,
				},
				wait: 300,
			});

			await util.holdTillDrained(sendQueue);
			await util.timer(1000);

			let resultPresist = await client.exchange.nodeRepository.get("*");
			let resultDataService = await client.exchange.dataService.getSnapShot();

			expect(resultPresist).to.be.instanceOf(Array);
			expect(resultPresist.length).to.be.equal(2);

			let cbb = await resultPresist.find(
				unit => parseInt(unit.meta[serial]) === 13 && unit.meta[typeId] === 3,
			);

			expect(cbb.state[communicationStatus]).to.be.equal(1); // communication status
			expect(cbb.data[childCount]).to.be.equal(0);

			expect(resultDataService[3][13].state[communicationStatus]).to.be.equal(1);
			expect(resultDataService[3][13].data[childCount]).to.be.equal(0);

			//let snapshot = await client.exchange.dataService.getSnapShot();
			//console.log(JSON.stringify(snapshot));
		});

		it("can process a packet with CBBs and EDD Data 1 where no CBBs currently in database", async () => {
			sendQueue.push({
				message: {
					packet: PktBldr.withCommand(4)
						.withParent(13)
						.withData([
							{ serial: 4423423, windowId: 1 },
							{ serial: 4523434, windowId: 2 },
						])
						.build(),
					createdAt,
				},
				wait: 300,
			});

			sendQueue.push({
				message: {
					packet: PktBldr.withCommand(5)
						.withParent(13)
						.withData([
							{
								serial: 13,
								childCount: 2,
								ledState: 6,
								rawData: [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1],
							},
							{
								windowId: 2,
								rawData: [1, 0, 0, 0, 0, 0, 0, 1],
								delay: 2000,
							},
						])
						.build(),
					createdAt,
				},
				wait: 300,
			});

			await util.holdTillDrained(sendQueue);
			await util.timer(3000);

			const resultPersist = await client.exchange.nodeRepository.get("*");
			expect(resultPersist).to.be.instanceOf(Array);
			expect(resultPersist.length).to.be.greaterThan(3);

			const cbb = resultPersist.find(x => x.meta[serial] === 13 && x.meta[typeId] === 3);
			const edd1 = resultPersist.find(x => x.meta[serial] === "0.69.5.170" && x.meta[typeId] === 4);

			expect(cbb.state[communicationStatus]).to.equal(1);
			expect(edd1.meta[windowId]).to.equal(2);
			expect(edd1.data[delay]).to.equal(2000);
			expect(cbb.data[childCount]).to.equal(2);

			const logs = await client.exchange.logsRepository.get("*", 0, Date.now(), 50);
			console.log(logs);
			// let snapshot = await client.exchange.dataService.getSnapShot();
			// console.log(JSON.stringify(snapshot));
		});

		it("can process a packet with CBBs and EDD Data 1 where  CBBs  and EDD currently in database", async function() {
			sendQueue.push({
				message: {
					packet: PktBldr.withCommand(4)
						.withParent(13)
						.withData([
							{ serial: 4423423, windowId: 1 },
							{ serial: 4523434, windowId: 2 },
						])
						.build(),
					createdAt,
				},
				wait: 300,
			});

			sendQueue.push({
				message: {
					packet: PktBldr.withCommand(5)
						.withParent(13)
						.withData([
							{
								serial: 13,
								childCount: 2,
								ledState: 6,
								rawData: [0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1],
							},
							{
								windowId: 2,
								rawData: [1, 0, 0, 0, 0, 0, 0, 1],
								delay: 2000,
							},
						])
						.build(),
					createdAt,
				},
				wait: 300,
			});

			sendQueue.push({
				message: {
					packet: PktBldr.withCommand(5)
						.withParent(13)
						.withData([
							{
								serial: 13,
								childCount: 2,
								ledState: 6,
								rawData: [1, 1, 0, 0, 1, 0, 0, 0, 1, 1, 1],
							},
							{
								windowId: 2,
								rawData: [1, 0, 0, 0, 0, 1, 1, 1],
								delay: 3000,
							},
						])
						.build(),
					createdAt,
				},
				wait: 300,
			});

			await util.holdTillDrained(sendQueue);
			await util.timer(2000);

			let snapshot = await client.exchange.dataService.getSnapShot();
			console.log(JSON.stringify(snapshot, null, 2));

			const resultPersist = await client.exchange.nodeRepository.get("*");
			expect(resultPersist).to.be.instanceOf(Array);
			expect(resultPersist.length).to.be.greaterThan(3);

			const cbb = resultPersist.find(x => x.meta[serial] === 13 && x.meta[typeId] === 3);
			expect(cbb.state[communicationStatus]).to.equal(1);
			expect(cbb.data[childCount]).to.equal(2);

			const edd1 = resultPersist.find(x => x.meta[serial] === "0.69.5.170" && x.meta[typeId] === 4);
			expect(edd1.meta[windowId]).to.equal(2);
			expect(edd1.data[delay]).to.equal(3000);
		});

		it("can handle a packet with CBBs and EDD Data 1 where CBBs  is current  and EDD not in database", async function() {
			sendQueue.push({
				message: {
					packet: PktBldr.withCommand(5)
						.withParent(13)
						.withData([
							{
								serial: 13,
								childCount: 1,
								ledState: 6,
								rawData: [0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1],
							},
							{
								windowId: 2,
								rawData: [1, 0, 0, 0, 0, 0, 0, 1],
								delay: 2000,
							},
						])
						.build(),
					createdAt,
				},
				wait: 300,
			});

			sendQueue.push({
				message: {
					packet: PktBldr.withCommand(5)
						.withParent(13)
						.withData([
							{
								serial: 13,
								childCount: 2,
								ledState: 6,
								rawData: [0, 1, 0, 0, 1, 0, 0, 0, 1, 1, 1],
							},
							{
								windowId: 2,
								rawData: [1, 0, 0, 0, 0, 1, 1, 1],
								delay: 3000,
							},
						])
						.build(),
					createdAt,
				},
				wait: 300,
			});

			await util.holdTillDrained(sendQueue);
			await util.timer(2000);

			let resPersist = await client.exchange.nodeRepository.get("*");

			expect(resPersist).to.be.instanceOf(Array);
			expect(resPersist.length).to.be.equal(3);

			let cbb = resPersist.find(x => x.meta[typeId] === 3);

			expect(cbb.state[communicationStatus]).to.equal(1); // communication status

			let edd = resPersist.find(x => x.meta[typeId] === 4);
			expect(edd.meta[windowId]).to.equal(2); // communication status
			expect(edd.data[delay]).to.equal(3000); // communication status
		});

		it("can process a change packet with CBBs and EDD Data 1 where  CBBs and EDD currently in database", async function() {
			sendQueue.push({
				message: {
					packet: PktBldr.withCommand(4)
						.withParent(13)
						.withData([
							{ serial: 4423423, windowId: 1 },
							{ serial: 4523434, windowId: 2 },
						])
						.build(),
					createdAt,
				},
				wait: 300,
			});

			sendQueue.push({
				message: {
					packet: PktBldr.withCommand(5)
						.withParent(13)
						.withData([
							{
								serial: 13,
								childCount: 1,
								ledState: 6,
								rawData: [0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1],
							},
							{
								windowId: 2,
								rawData: [1, 0, 0, 0, 0, 0, 0, 1],
								delay: 2000,
							},
						])
						.build(),
					createdAt,
				},
				wait: 300,
			});

			sendQueue.push({
				message: {
					packet: PktBldr.withCommand(5)
						.withParent(13)
						.withData([
							{
								serial: 13,
								childCount: 2,
								ledState: 6,
								rawData: [0, 1, 0, 0, 0, 0, 0, 0, 1, 1, 0],
							},
							{
								windowId: 2,
								rawData: [1, 0, 0, 0, 0, 1, 1, 1],
								delay: 3000,
							},
						])
						.build(),
					createdAt,
				},
				wait: 300,
			});

			sendQueue.push({
				message: {
					packet: PktBldr.withCommand(5)
						.withParent(13)
						.withData([
							{
								serial: 13,
								childCount: 2,
								ledState: 6,
								rawData: [0, 1, 0, 0, 1, 0, 1, 0, 1, 1, 1],
							},
							{
								windowId: 2,
								rawData: [0, 0, 0, 0, 1, 1, 1],
								delay: 3000,
							},
						])
						.build(),
					createdAt,
				},
				wait: 300,
			});

			await util.holdTillDrained(sendQueue);
			await util.timer(1000);

			// let snapshot = await client.exchange.dataService.getSnapShot();
			// console.log(JSON.stringify(snapshot, null, 2));

			let resPersist = await client.exchange.nodeRepository.get("*");
			expect(resPersist).to.be.instanceOf(Array);
			expect(resPersist.length).to.be.greaterThan(3);

			const cbb = resPersist.find(x => x.meta[serial] === 13 && x.meta[typeId] === 3);
			//expect(cbb[communicationStatus]).to.equal(1);
			expect(cbb.data[childCount]).to.equal(2);
			console.log("persist", JSON.stringify(resPersist, null, 2));

			const edd1 = resPersist.find(
				x => x.meta[serial] === IntToIP(4523434).toIP() && x.meta[typeId] === 4,
			);
			expect(edd1.meta[windowId]).to.equal(2);
			expect(edd1.data[delay]).to.equal(3000);
		});

		it("can process a change packet with CBBs and EDD Data 1 where  CBBs and EDD currently in database3", async function() {
			sendQueue.push({
				message: {
					packet: PktBldr.withCommand(4)
						.withParent(13)
						.withData([
							{ serial: 4423423, windowId: 1 },
							{ serial: 4523434, windowId: 2 },
						])
						.build(),
					createdAt,
				},
				wait: 300,
			});

			sendQueue.push({
				message: {
					packet: PktBldr.withCommand(5)
						.withParent(13)
						.withData([
							{
								serial: 13,
								childCount: 1,
								ledState: 6,
								rawData: [0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1],
							},
							{
								windowId: 2,
								rawData: [0, 0, 0, 0, 0, 0, 1],
								delay: 2000,
							},
						])
						.build(),
					createdAt: createdAt + 500,
				},
				wait: 300,
			});

			sendQueue.push({
				message: {
					packet: PktBldr.withCommand(5)
						.withParent(13)
						.withData([
							{
								serial: 13,
								childCount: 2,
								ledState: 6,
								rawData: [0, 1, 0, 0, 0, 0, 0, 0, 1, 1, 0],
							},
							{
								windowId: 2,
								rawData: [0, 0, 0, 0, 1, 1, 1],
								delay: 3000,
							},
						])
						.build(),
					createdAt: createdAt + 1000,
				},
				wait: 300,
			});

			sendQueue.push({
				message: {
					packet: PktBldr.withCommand(5)
						.withParent(13)
						.withData([
							{
								serial: 13,
								childCount: 2,
								ledState: 6,
								rawData: [0, 1, 0, 0, 1, 0, 1, 0, 1, 1, 1],
							},
						])
						.build(),
					createdAt,
				},
				wait: 300,
			});

			await util.holdTillDrained(sendQueue);
			await util.timer(2000);

			const logs = await client.exchange.logsRepository.get("*", 1000, Date.now());
			console.log(JSON.stringify(logs, null, 2));

			//let snapshot = await client.exchange.dataService.getSnapShot();

			let resPersist = await client.exchange.nodeRepository.get("*");
			expect(resPersist).to.be.instanceOf(Array);
			expect(resPersist.length).to.be.greaterThan(3);
			console.log(JSON.stringify(resPersist, null, 2));

			const cbb = resPersist.find(x => x.meta[serial] === 13 && x.meta[typeId] === 3);
			//expect(cbb[communicationStatus]).to.equal(1);
			expect(cbb.data[childCount]).to.equal(2);
			const edd1 = resPersist.find(x => x.meta[serial] === "0.69.5.170" && x.meta[typeId] === 4);
			expect(edd1.meta[windowId]).to.equal(2);
			expect(edd1.data[delay]).to.equal(3000);
		});

		it("can turn off detonatorStatus in attached dets with a keyswitch off", async function() {
			sendQueue.push({
				message: {
					packet: PktBldr.withCommand(4)
						.withParent(13)
						.withData([
							{ serial: 4423423, windowId: 1 },
							{ serial: 4523434, windowId: 2 },
						])
						.build(),
					createdAt,
				},
				wait: 300,
			});

			sendQueue.push({
				message: {
					packet: PktBldr.withCommand(5)
						.withParent(13)
						.withData([
							{
								serial: 13,
								childCount: 2,
								ledState: 6,
								rawData: [1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
							},
							{
								windowId: 1,
								rawData: [1, 0, 0, 0, 1, 1, 1],
								delay: 2000,
							},
						])
						.build(),
					createdAt: createdAt + 300,
				},
				wait: 300,
			});

			sendQueue.push({
				message: {
					packet: PktBldr.withCommand(5)
						.withParent(13)
						.withData([
							{
								serial: 13,
								childCount: 2,
								ledState: 6,
								rawData: [1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1],
							},
							{
								windowId: 2,
								rawData: [1, 0, 0, 0, 1, 1, 1],
								delay: 2000,
							},
						])
						.build(),
					createdAt: createdAt + 600,
				},
				wait: 300,
			});

			await util.holdTillDrained(sendQueue);
			await util.timer(3000);

			let resPersist = await client.exchange.nodeRepository.get("*");

			if (resPersist == null || resPersist.length == 0) throw new Error("Empty resPersist!");

			let cbb = resPersist.find(x => x.meta[serial] === 13 && x.meta[typeId] === 3);
			let edd1 = resPersist.find(x => x.meta[serial] === "0.69.5.170" && x.meta[typeId] === 4);

			//expect(cbb[communicationStatus]).to.equal(1);
			expect(cbb.data[keySwitchStatus]).to.equal(1);
			expect(cbb.data[childCount]).to.equal(2);
			//expect(edd1[communicationStatus]).to.equal(0);

			sendQueue.push({
				message: {
					packet: PktBldr.withCommand(5)
						.withParent(13)
						.withData([
							{
								serial: 13,
								childCount: 2,
								ledState: 6,
								rawData: [1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
							},
						])
						.build(),
					createdAt: Date.now() + 900,
				},
				wait: 300,
			});

			await util.holdTillDrained(sendQueue);
			await util.timer(2000);
			resPersist = await client.exchange.nodeRepository.get("*");
			if (resPersist == null || resPersist.length == 0) throw new Error("Empty resPersist!");

			cbb = resPersist.find(x => x.meta[serial] === 13 && x.meta[typeId] === 3);
			edd1 = resPersist.find(x => x.meta[windowId] === 2);
			//const snapshot = await client.exchange.dataService.getSnapShot();

			expect(cbb.state[communicationStatus]).to.equal(1);
			expect(cbb.data[keySwitchStatus]).to.equal(0);
			expect(cbb.data[childCount]).to.equal(2);
			expect(edd1.state[communicationStatus]).to.equal(0);
		});
	});
});
