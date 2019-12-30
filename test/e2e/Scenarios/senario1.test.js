const chai = require("chai");
const expect = chai.expect;
chai.use(require("chai-match"));

const ServerHelper = require("../../helpers/server_helper");
const PktBldr = require("imperator-packet-constructor");
const Queue = require("better-queue");
const Mesh = require("happner-2");

const util = require("../../helpers/utils");
const fields = require("../../../lib/configs/fields/fieldConstants");
const { communicationStatus, keySwitchStatus, detonatorStatus } = fields;

describe("INTEGRATION - Units", async function() {
	this.timeout(60000);
	let serverHelper = new ServerHelper();
	let client;

	const sendQueue = new Queue((task, cb) => {
		setTimeout(() => {
			client.exchange.queueService.processIncoming(task.message);
			cb();
		}, task.wait);
	});

	context("Scenario 1", async () => {
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
			await client.exchange.blastRepository.delete("*");
			await client.exchange.dataService.clearDataModel();

			sendQueue.push({
				message: {
					packet: PktBldr.withCommand(8)
						.withParent(8)
						.withData([0, 0, 0, 0, 0, 0, 0, 0])
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

		/*
        type 3: {
		5: isolationRelay,
		6: lfs,
		7: blastArmed,
		8: tooLowBat,
		9: lowBat,
		10: dcSupplyVoltage,
		11: shaftFault,
		12: mains,
		13: earthLeakage,
		14: cableFault,
		15: keySwitchStatus,
	*/
		it("it can load two CBBs and turn off communication status when CCB is armed", async () => {
			//load CBB 13
			sendQueue.push({
				message: {
					packet: PktBldr.withCommand(5)
						.withParent(13)
						.withData([
							{
								serial: 13,
								childCount: 0,
								ledState: 1,
								//main:1 dcSupply:1
								rawData: [0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0],
							},
						])
						.build(),
					createdAt,
				},
				wait: 300,
			});

			let dets100 = Array(10)
				.fill()
				.map((unit, index) => ({ serial: 4423423 + index, windowId: index + 1 }));
			//load two EDDS using command 4
			sendQueue.push({
				message: {
					packet: PktBldr.withCommand(4)
						.withParent(13)
						.withData([...dets100])
						.build(),
					createdAt,
				},
				wait: 300,
			});

			/*
            EDD: {
		    1: fields.bridgeWire,
		    2: fields.calibration,
		    3: fields.program,
		    4: fields.boosterFired,
		    5: fields.tagged,
		    6: fields.detonatorStatus,
		    7: fields.logged,
            }
            */
			dets100 = Array(10)
				.fill()
				.map((unit, index) => ({
					windowId: index + 1,
					rawData: [1, 1, 0, 0, 1, 1, 1],
					delay: index + 100,
				}));

			sendQueue.push({
				message: {
					packet: PktBldr.withCommand(5)
						.withParent(13)
						.withData([
							{
								serial: 13,
								childCount: 100,
								ledState: 2,
								//main:1 dcSupply:1 keyswitch: 1
								rawData: [0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 1],
							},
							...dets100,
						])
						.build(),
					createdAt,
				},
				wait: 300,
			});

			await util.holdTillDrained(sendQueue);
			await util.timer(1200);

			let resultDataService = await client.exchange.dataService.getSnapShot();

			// console.log(resultDataService[0][8]);
			// console.log(resultDataService[3][13]);
			console.log(resultDataService);

			expect(resultDataService[0][8].data[keySwitchStatus]).to.be.equal(0);
			expect(resultDataService[3][13].state[communicationStatus]).to.be.equal(1);
			expect(resultDataService[4][13][1].data[detonatorStatus]).to.be.equal(1);
			expect(resultDataService[4][13][1].state[communicationStatus]).to.be.equal(1);
			// expect(resultDataService[3][13].data[childCount]).to.be.equal(0);

			// let snapshot = await client.exchange.dataService.getSnapShot();
			// console.log(JSON.stringify(snapshot));

			/*
            [unitTypes.CONTROL_UNIT]: {
		    0: keySwitchStatus,
		    1: isolationRelay,
		    2: fireButton,
		    3: cableFault,
		    4: earthLeakage,
		    5: null,
		    6: blastArmed,
		    7: null,
            },
            */
			//CCB ARMED
			sendQueue.push({
				message: {
					packet: PktBldr.withCommand(8)
						.withParent(8)
						.withData([0, 1, 0, 0, 0, 0, 0, 1])
						.build(),
					createdAt,
				},
				wait: 600,
			});

			//CCB ARMED and FIRING
			sendQueue.push({
				message: {
					packet: PktBldr.withCommand(8)
						.withParent(8)
						.withData([0, 1, 0, 0, 0, 1, 0, 1])
						.build(),
					createdAt,
				},
				wait: 600,
			});

			await util.holdTillDrained(sendQueue);
			await util.timer(4000);
			resultDataService = await client.exchange.dataService.getSnapShot();
			expect(resultDataService[0][8].data[keySwitchStatus]).to.be.equal(1);
			//expect the communication status to be 0
			expect(resultDataService[3][13].state[communicationStatus]).to.be.equal(1);
			expect(resultDataService[4][13][1].data[detonatorStatus]).to.be.equal(1);
			expect(resultDataService[4][13][1].state[communicationStatus]).to.be.equal(1);

			//CCB FIREBUTTON RELEASE
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

			//CCB DISARMED
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

			/*
            EDD: {
		    1: fields.bridgeWire,
		    2: fields.calibration,
		    3: fields.program,
		    4: fields.boosterFired,
		    5: fields.tagged,
		    6: fields.detonatorStatus,
		    7: fields.logged,
            }
            */
			//RETURN THE DATA
			dets100 = Array(10)
				.fill()
				.map((unit, index) => ({
					windowId: index + 1,
					rawData: [1, 0, 0, 1, 0, 0, 0],
					delay: index + 100,
				}));

			await util.holdTillDrained(sendQueue);
			await util.timer(4000);
			sendQueue.push({
				message: {
					packet: PktBldr.withCommand(5)
						.withParent(13)
						.withData([
							{
								serial: 13,
								childCount: 4,
								ledState: 2,
								//main:1 dcSupply:1 keyswitch: 1
								rawData: [0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 1],
							},
							...dets100,
						])
						.build(),
					createdAt,
				},
				wait: 300,
			});

			await util.holdTillDrained(sendQueue);
			await util.timer(4000);

			resultDataService = await client.exchange.dataService.getSnapShot();
			const blastIndex = await client.exchange.blastRepository.get("index");
			console.log(blastIndex);
			const blastKeys = Object.keys(blastIndex);
			const blastReport = await client.exchange.blastRepository.get(blastKeys[0], true);
			const blastReportCompressed = await client.exchange.blastRepository.get(blastKeys[0]);
			console.log(JSON.stringify(blastReport));
			console.log(JSON.stringify(blastReport).length);
			console.log(JSON.stringify(blastReportCompressed).length);

			const logs = await client.exchange.logsRepository.get("*");
			console.log(JSON.stringify(logs));
		});
	});
});
