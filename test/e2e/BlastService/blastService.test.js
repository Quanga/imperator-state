/* eslint-disable no-unused-vars */
const chai = require("chai");
const expect = chai.expect;
chai.use(require("chai-match"));
const sinon = require("sinon");
const sinonChai = require("sinon-chai");
chai.use(sinonChai);

const SimData = require("./blastMessages");
const Queue = require("better-queue");
const Happner = require("happner-2");
const Config = require("../../../config");

const utils = require("../../helpers/utils");
describe("E2E - Services", async function() {
	this.timeout(80000);
	const simData = new SimData();
	process.env.MODE = "HYDRA";
	context("Blast Service", async () => {
		const override = {
			systemMode: "HYDRA",
			logLevel: "info",
			name: "edge_state",
			db: "./edge.db",
			host: "0.0.0.0",
			port: 55007,
			logFile: "./test_edge.log",
			useEndpoint: false,
			endpointName: "edge_ssot",
			endpointIP: "0.0.0.0",
			endpointPort: 55008,
			endpointCheckInterval: 3000,
			endpointUsername: "UNIT001",
			endpointPassword: "happn",
			systemFiringTime: 20000,
			systemReportTime: 30000,
			communicationCheckInterval: 300000,
		};

		let mesh, config;

		const sendQueue = new Queue((task, cb) => {
			setTimeout(() => {
				mesh.exchange.queueService
					.processIncoming(task.message)
					.then(() => cb())
					.catch(err => cb(err));
			}, task.wait);
		});

		beforeEach("delete all current nodes, logs, warnings and packets", async function() {
			config = new Config(override).configuration;
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
			mesh.stop();
		});

		it("can create a new blast model from a snapshot", async () => {
			const thisData = simData.createBlast1();
			thisData.forEach(messageObj => sendQueue.push(messageObj));

			await utils.holdTillDrained(sendQueue);
			await utils.timer(3000);

			let result = await mesh.exchange.blastRepository.get("index");
			delete result._meta;

			let blastIds = Object.keys(result);
			let firstBlastId = await mesh.exchange.blastRepository.get(blastIds[0]);
			delete firstBlastId._meta;

			console.log(result);
			console.log(JSON.stringify(firstBlastId));
		});
	});
});
