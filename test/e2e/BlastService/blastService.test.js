/* eslint-disable no-unused-vars */
const chai = require("chai");
const expect = chai.expect;
chai.use(require("chai-match"));

const SimData = require("./blastMessages");
const Queue = require("better-queue");
const ServerHelper = require("../../helpers/server_helper");
const Mesh = require("happner-2");

const utils = require("../../helpers/utils");

describe("E2E - Services", async function() {
	const serverHelper = new ServerHelper();
	this.timeout(60000);
	const simData = new SimData();

	context("Blast Service", async () => {
		let client;

		const sendQueue = new Queue((task, cb) => {
			setTimeout(() => {
				client.exchange.queueService
					.processIncoming(task.message)
					.then(() => cb())
					.catch(err => cb(err));
			}, task.wait);
		});

		before(async () => {
			await serverHelper.startServer("test");

			client = await new Mesh.MeshClient({
				secure: true,
				port: 55000,
			});
			await utils.asyncLogin(client);
		});

		beforeEach(async () => {
			await client.exchange.logsRepository.delete("*");
			await client.exchange.warningsRepository.delete("*");
			await client.exchange.nodeRepository.delete("*");
			await client.exchange.dataService.clearDataModel();
		});

		after(async () => {
			client.disconnect();
			await serverHelper.stopServer();
		});

		it("can create a new blast model from a snapshot", async () => {
			const thisData = simData.createBlast1();

			thisData.forEach(messageObj => sendQueue.push(messageObj));

			await utils.holdTillDrained(sendQueue);
			await utils.timer(5000);

			//let model = await mesh.exchange.blastService.getBlastModel();
			let result = await client.exchange.blastRepository.get("index", "false");
			delete result._meta;

			let blastIds = Object.keys(result);
			let firstBlastId = await client.exchange.blastRepository.get(blastIds[0], "true");
			expect(firstBlastId).to.exists;
			delete firstBlastId._meta;

			console.log("index", result);
			console.log("blats", JSON.stringify(firstBlastId));
		});
	});
});
