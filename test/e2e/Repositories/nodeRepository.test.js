/* eslint-disable no-unused-vars */
/* eslint-disable no-unused-vars */
const chai = require("chai");
const expect = chai.expect;
chai.use(require("chai-match"));
const sinon = require("sinon");
const sinonChai = require("sinon-chai");
chai.use(sinonChai);

const PktBldr = require("imperator-packet-constructor");
const util = require("../../helpers/utils");
const Queue = require("better-queue");
const Happner = require("happner-2");
const fields = require("../../../lib/configs/fields/fieldConstants");

require("dotenv").config({ path: `${__dirname}/.env.test` });
const config = require("../../../happner.config");
describe("E2E - Repository", async function() {
	this.timeout(10000);

	context("Node Repository", async () => {
		let mesh;

		const sendQueue = new Queue((task, cb) => {
			setTimeout(() => {
				mesh.exchange.queueService.processIncoming(task.message).then(() => cb());
			}, task.wait);
		});

		beforeEach(async () => {
			mesh = new Happner();

			await mesh.initialize(config);
			await mesh.start();

			await mesh.exchange.nodeRepository.delete("*");
			await mesh.exchange.logsRepository.delete("*");
			await mesh.exchange.warningsRepository.delete("*");
			await mesh.exchange.blastRepository.delete("*");
			await mesh.exchange.dataService.clearDataModel();

			expect(mesh._mesh.started).to.be.true;
		});

		after(async () => {
			await mesh.stop();
		});

		it("can get the dets for a cbb by using the path", async function() {
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
						.withParent(13)
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
						.withParent(13)
						.withData([
							{
								serial: 13,
								childCount: 2,
								ledState: 6,
								rawData: [0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1],
							},
							{
								windowId: 2,
								rawData: [1, 0, 0, 0, 0, 0, 0, 1],
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
						.withParent(13)
						.withData([
							{
								serial: 13,
								childCount: 2,
								ledState: 6,
								rawData: [0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 1, 1],
							},
							{
								windowId: 2,
								rawData: [1, 0, 0, 0, 0, 1, 1, 1],
								delay: 3000,
							},
						])
						.build(),
					createdAt: Date.now(),
				},
				wait: 300,
			});

			await util.holdTillDrained(sendQueue);
			await util.timer(2000);

			const dets = await mesh.exchange.nodeRepository.get("3/13/*");
			console.log("DETS", dets);
			expect(dets[1].data[fields.logged]).to.eql(1);
			expect(dets[1].state[fields.communicationStatus]).to.eql(0);
		});
	});
});
