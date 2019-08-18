const chai = require("chai");
const expect = chai.expect;
chai.use(require("chai-match"));

const ServerHelper = require("../../helpers/server_helper");
const PacketConstructor = require("../../../lib/builders/packetConstructor");
const Queue = require("better-queue");
const Mesh = require("happner-2");

const utils = require("../../helpers/utils");

describe("E2E - AXXIS", async function() {
	this.timeout(15000);
	let serverHelper = new ServerHelper();
	let client;

	const sendQueue = new Queue((task, cb) => {
		setTimeout(() => {
			client.exchange.queueService.processIncoming(task.message);
			cb();
		}, task.wait);
	});

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

	context("CBB100 data test - 05 Command", async () => {
		before(async () => {
			try {
				await serverHelper.startServer("test");

				client = await new Mesh.MeshClient({
					secure: true,
					port: 55000
				});

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
		});

		it("can process a packet with CBBs Data 1 where no CBBs are currently in database", async () => {
			sendQueue.push({
				message: {
					packet: new PacketConstructor(5, 13, {
						data: [
							{
								serial: 13,
								childCount: 0,
								ledState: 6,
								rawData: [0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1]
							}
						]
					}).packet,
					created: Date.now()
				},
				wait: 300
			});

			await holdAsync();
			await utils.timer(2000);

			let resultPresist = await client.exchange.nodeRepository.getAllNodes();
			let resultDataService = await client.exchange.dataService.getSnapShot();
			if (resultPresist == null || resultPresist.length === 0) throw new Error("Empty result!");

			let cbb = await resultPresist.find(unit => parseInt(unit.serial) === 13 && unit.typeId === 3);

			expect(cbb.communicationStatus).to.be.equal(1); // communication status
			expect(cbb.childCount).to.be.equal(0);
			expect(resultDataService.units["13"].data.communicationStatus).to.be.equal(1);
			expect(resultDataService.units["13"].data.childCount).to.be.equal(0);

			//let snapshot = await client.exchange.dataService.getSnapShot();
			//console.log(JSON.stringify(snapshot));
		});

		it("can process a packet with CBBs and EDD Data 1 where no CBBs currently in database", async () => {
			sendQueue.push({
				message: {
					packet: new PacketConstructor(4, 13, {
						data: [{ serial: 4423423, windowId: 1 }, { serial: 4523434, windowId: 2 }]
					}).packet,
					created: Date.now()
				},
				wait: 300
			});

			sendQueue.push({
				message: {
					packet: new PacketConstructor(5, 13, {
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
					}).packet,
					created: Date.now()
				},
				wait: 300
			});

			await holdAsync();
			await utils.timer(2000);

			const resultPersist = await client.exchange.nodeRepository.getAllNodes();
			if (resultPersist === null || resultPersist.length === 0) throw new Error("Empty result!");

			let cbb = null,
				edd1 = null;

			await resultPersist.forEach(x => {
				if (parseInt(x.serial) === 13 && x.typeId === 3) cbb = x;
				if (parseInt(x.serial) === 4523434 && x.typeId === 4) edd1 = x;
			});

			expect(cbb.communicationStatus).to.equal(1); // communication status
			expect(edd1.windowId).to.equal(2); // communication status
			expect(edd1.delay).to.equal(2000); // communication status
			expect(cbb.childCount).to.equal(2);

			// let snapshot = await client.exchange.dataService.getSnapShot();
			// console.log(JSON.stringify(snapshot));
		});

		it("can process a packet with CBBs and EDD Data 1 where  CBBs  and EDD currently in database", async function() {
			sendQueue.push({
				message: {
					packet: new PacketConstructor(4, 13, {
						data: [{ serial: 4423423, windowId: 1 }, { serial: 4523434, windowId: 2 }]
					}).packet,
					created: Date.now()
				},
				wait: 300
			});

			sendQueue.push({
				message: {
					packet: new PacketConstructor(5, 13, {
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
					}).packet,
					created: Date.now()
				},
				wait: 300
			});

			sendQueue.push({
				message: {
					packet: new PacketConstructor(5, 13, {
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
					}).packet,
					created: Date.now()
				},
				wait: 300
			});

			await holdAsync();
			await utils.timer(2000);

			const resPersist = await client.exchange.nodeRepository.getAllNodes();

			if (resPersist == null || resPersist.length === 0) throw new Error("Empty resPersist!");

			let cbb = null,
				edd1 = null;

			resPersist.forEach(x => {
				if (parseInt(x.serial) === 13 && x.typeId === 3) cbb = x;
				if (parseInt(x.serial) === 4523434 && x.typeId === 4) edd1 = x;
			});

			expect(cbb.communicationStatus).to.equal(1);
			expect(edd1.windowId).to.equal(2);
			expect(edd1.delay).to.equal(3000);
			expect(cbb.childCount).to.equal(2);

			// let snapshot = await client.exchange.dataService.getSnapShot();
			// console.log(JSON.stringify(snapshot));
		});

		it("can handle a packet with CBBs and EDD Data 1 where CBBs  is current  and EDD not in database", async function() {
			sendQueue.push({
				message: {
					packet: new PacketConstructor(5, 13, {
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
					}).packet,
					created: Date.now()
				},
				wait: 300
			});

			sendQueue.push({
				message: {
					packet: new PacketConstructor(5, 13, {
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
					}).packet,
					created: Date.now()
				},
				wait: 300
			});

			await holdAsync();
			await utils.timer(2000);

			let resPersist = await client.exchange.nodeRepository.getAllNodes();

			if (resPersist == null || resPersist.length === 0) throw new Error("Empty resPersist!");

			let cbb = resPersist.filter(x => x.typeId === 3);
			let edd = resPersist.filter(x => x.typeId === 4);
			expect(cbb[0].communicationStatus).to.equal(1); // communication status
			expect(edd[0].windowId).to.equal(2); // communication status
			expect(edd[0].delay).to.equal(3000); // communication status
		});

		it("can process a change packet with CBBs and EDD Data 1 where  CBBs and EDD currently in database", async function() {
			sendQueue.push({
				message: {
					packet: new PacketConstructor(4, 13, {
						data: [{ serial: 4423423, windowId: 1 }, { serial: 4523434, windowId: 2 }]
					}).packet,
					created: Date.now()
				},
				wait: 300
			});

			sendQueue.push({
				message: {
					packet: new PacketConstructor(5, 13, {
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
					}).packet,
					created: Date.now()
				},
				wait: 300
			});

			sendQueue.push({
				message: {
					packet: new PacketConstructor(5, 13, {
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
					}).packet,
					created: Date.now()
				},
				wait: 300
			});

			sendQueue.push({
				message: {
					packet: new PacketConstructor(5, 13, {
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
					}).packet,
					created: Date.now()
				},
				wait: 300
			});

			await holdAsync();
			await utils.timer(3000);
			let resPersist = await client.exchange.nodeRepository.getAllNodes();

			if (resPersist == null || resPersist.length == 0) throw new Error("Empty resPersist!");

			let cbb = null,
				edd1 = null;

			resPersist.forEach(x => {
				if (parseInt(x.serial) === 13 && x.typeId === 3) cbb = x;
				if (parseInt(x.serial) === 4523434 && x.typeId === 4) edd1 = x;
			});

			expect(cbb.communicationStatus).to.equal(1);
			expect(cbb.childCount).to.equal(2);
			expect(edd1.windowId).to.equal(2);
			expect(edd1.delay).to.equal(3000);
		});

		it("can process a change packet with CBBs and EDD Data 1 where  CBBs and EDD currently in database3", async function() {
			sendQueue.push({
				message: {
					packet: new PacketConstructor(4, 13, {
						data: [{ serial: 4423423, windowId: 1 }, { serial: 4523434, windowId: 2 }]
					}).packet,
					created: Date.now()
				},
				wait: 300
			});

			sendQueue.push({
				message: {
					packet: new PacketConstructor(5, 13, {
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
					}).packet,
					created: Date.now()
				},
				wait: 300
			});

			sendQueue.push({
				message: {
					packet: new PacketConstructor(5, 13, {
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
					}).packet,
					created: Date.now()
				},
				wait: 300
			});

			sendQueue.push({
				message: {
					packet: new PacketConstructor(5, 13, {
						data: [
							{
								serial: 13,
								childCount: 2,
								ledState: 6,
								rawData: [0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 1, 0, 1, 1, 1]
							}
						]
					}).packet,
					created: Date.now()
				},
				wait: 300
			});

			await holdAsync();
			await utils.timer(1000);
			let resPersist = await client.exchange.nodeRepository.getAllNodes();

			if (resPersist == null || resPersist.length == 0) throw new Error("Empty resPersist!");

			let cbb = null,
				edd1 = null;

			resPersist.forEach(x => {
				if (parseInt(x.serial) === 13 && x.typeId === 3) cbb = x;
				if (parseInt(x.serial) === 4523434 && x.typeId === 4) edd1 = x;
			});

			expect(cbb.communicationStatus).to.equal(1);
			expect(cbb.childCount).to.equal(2);
			expect(edd1.windowId).to.equal(2);
			expect(edd1.delay).to.equal(3000);
		});

		it("can turn off detonatorStatus in attached dets with a keyswitch off", async function() {
			sendQueue.push({
				message: {
					packet: new PacketConstructor(4, 13, {
						data: [{ serial: 4423423, windowId: 1 }, { serial: 4523434, windowId: 2 }]
					}).packet,
					created: Date.now()
				},
				wait: 300
			});

			sendQueue.push({
				message: {
					packet: new PacketConstructor(5, 13, {
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
					}).packet,
					created: Date.now()
				},
				wait: 300
			});

			sendQueue.push({
				message: {
					packet: new PacketConstructor(5, 13, {
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
					}).packet,
					created: Date.now()
				},
				wait: 300
			});

			await holdAsync();
			await utils.timer(1000);

			let resPersist = await client.exchange.nodeRepository.getAllNodes();

			if (resPersist == null || resPersist.length == 0) throw new Error("Empty resPersist!");

			let cbb = null,
				edd1 = null;

			resPersist.forEach(x => {
				if (parseInt(x.serial) === 13 && x.typeId === 3) cbb = x;
				if (parseInt(x.serial) === 4523434 && x.typeId === 4) edd1 = x;
			});

			expect(cbb.communicationStatus).to.equal(1);
			expect(cbb.childCount).to.equal(2);
			expect(edd1.detonatorStatus).to.equal(1);

			sendQueue.push({
				message: {
					packet: new PacketConstructor(5, 13, {
						data: [
							{
								serial: 13,
								childCount: 2,
								ledState: 6,
								rawData: [0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 1, 0, 1, 1, 0]
							}
						]
					}).packet,
					created: Date.now()
				},
				wait: 300
			});

			await holdAsync();
			await utils.timer(2000);
			resPersist = await client.exchange.nodeRepository.getAllNodes();

			if (resPersist == null || resPersist.length == 0) throw new Error("Empty resPersist!");

			resPersist.forEach(x => {
				if (parseInt(x.serial) === 13 && x.typeId === 3) cbb = x;
				if (parseInt(x.serial) === 4523434 && x.typeId === 4) edd1 = x;
			});

			expect(cbb.communicationStatus).to.equal(1);
			expect(cbb.childCount).to.equal(2);
			expect(edd1.detonatorStatus).to.equal(0);
		});

		it("edge case - will ignore an 05 packet where the serial is 255 and the windowID is 255", async function() {
			//this is an edge case where a packet comes in after and EDDSIG which has an EDD with
			//a delay of 255 and a windowID of 255

			//prior to new revision all 05 commands could write to db, so it was ignored.

			//item taken from cbb 115 - 27/05/2019
			//aaaa1005007300001828ff00ff001288

			//this fix is only applied in the data service after the EDDSIG
			sendQueue.push({
				message: {
					packet: "aaaa1005007300001828ff00ff001288",
					created: Date.now()
				},
				wait: 300
			});

			await utils.timer(2000);

			let result = await client.exchange.nodeRepository.getAllNodes();

			expect(result.length).to.eql(2);
			expect(result[1].childCount).to.eql(0);
		});

		it("can turn off childCount", async function() {
			sendQueue.push({
				message: {
					packet: new PacketConstructor(4, 13, {
						data: [{ serial: 4423423, windowId: 1 }, { serial: 4523434, windowId: 2 }]
					}).packet,
					created: Date.now()
				},
				wait: 300
			});

			sendQueue.push({
				message: {
					packet: new PacketConstructor(5, 13, {
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
					}).packet,
					created: Date.now()
				},
				wait: 300
			});

			sendQueue.push({
				message: {
					packet: new PacketConstructor(5, 13, {
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
					}).packet,
					created: Date.now()
				},
				wait: 300
			});

			await holdAsync();
			await utils.timer(1000);

			let result = await client.exchange.nodeRepository.getAllNodes();

			if (result == null || result.length == 0) throw new Error("Empty result!");

			let cbb = null,
				edd1 = null;

			result.forEach(x => {
				if (parseInt(x.serial) === 13 && x.typeId === 3) cbb = x;
				if (parseInt(x.serial) === 4523434 && x.typeId === 4) edd1 = x;
			});

			expect(cbb.communicationStatus).to.equal(1);
			expect(cbb.childCount).to.equal(2);
			expect(edd1.detonatorStatus).to.equal(1);

			sendQueue.push({
				message: {
					packet: new PacketConstructor(5, 13, {
						data: [
							{
								serial: 13,
								childCount: 0,
								ledState: 6,
								rawData: [0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 1, 0, 1, 1, 0]
							}
						]
					}).packet,
					created: Date.now()
				},
				wait: 300
			});

			await holdAsync();
			await utils.timer(3000);
			result = await client.exchange.nodeRepository.getAllNodes();

			if (result == null || result.length == 0) throw new Error("Empty result!");

			result.forEach(x => {
				if (parseInt(x.serial) === 13 && x.typeId === 3) cbb = x;
				if (parseInt(x.serial) === 4523434 && x.typeId === 4) edd1 = x;
			});

			expect(cbb.communicationStatus).to.equal(1);
			expect(cbb.childCount).to.equal(0);
			expect(edd1.detonatorStatus).to.equal(0);
		});
	});
});
