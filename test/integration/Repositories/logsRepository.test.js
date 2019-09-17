/* eslint-disable no-unused-vars */
const chai = require("chai");
const expect = chai.expect;
chai.use(require("chai-match"));
const sinon = require("sinon");
const sinonChai = require("sinon-chai");
chai.use(sinonChai);

const sandbox = sinon.createSandbox();

var Mesh = require("happner-2");
const Happner = require("happner-2");
const Config = require("../../../config");
const util = require("../../helpers/utils");
const LogModel = require("../../../lib/models/logModel");

const override = {
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
	systemFiringTime: 120000,
	systemReportTime: 180000,
	communicationCheckInterval: 300000
};

describe("INTEGRATION - Repositories", async function() {
	this.timeout(10000);
	context("LogsRepository Tests", async () => {
		let config, mesh;

		beforeEach(async () => {
			config = new Config(override).configuration;
			mesh = new Happner();

			await mesh.initialize(config);
			expect(mesh._mesh.initialized).to.be.true;
			await mesh.start();
			expect(mesh._mesh.started).to.be.true;
			await mesh.exchange.nodeRepository.delete("*");
			await mesh.exchange.logsRepository.delete("*");
			await mesh.exchange.warningsRepository.delete("*");
			await mesh.exchange.blastRepository.delete("*");
			console.log("SATRTED");
		});

		afterEach(() => {
			sandbox.restore();
		});

		it("it can add logs to the Logs Repository and get with no TO or FROM", async () => {
			const createdAt = 10000;
			await mesh.exchange.logsRepository.delete("*");
			await util.timer(5000);

			for (let l = 0; l < 50; l++) {
				let logmodel = new LogModel();
				const sect = l * 1000;
				logmodel.setId({ logType: "TESTER", serial: 44, typeId: 3, createdAt: createdAt + sect });
				logmodel.setEvents[({ event: 1 }, { event: 2 })];

				await mesh.exchange.logsRepository.set(logmodel);
			}

			let get;
			try {
				get = await mesh.exchange.logsRepository.get("*");
			} catch (err) {
				console.log(err);
			}

			expect(get.length).to.be.equal(50);
			expect(get[0].createdAt).to.be.equal(createdAt);
			expect(get[49].createdAt).to.be.equal(59000);

			await mesh.stop();
			expect(mesh._mesh.stopped).to.be.true;
		});

		it("it can add logs to the Logs Repository and get with only FROM", async () => {
			const createdAt = 10000;
			await mesh.exchange.logsRepository.delete("*");

			for (let l = 0; l < 50; l++) {
				let logmodel = new LogModel();
				const sect = l * 1000;
				logmodel.setId({ logType: "TESTER", serial: 44, typeId: 3, createdAt: createdAt + sect });
				logmodel.setEvents[({ event: 1 }, { event: 2 })];

				await mesh.exchange.logsRepository.set(logmodel);
			}

			let get = await mesh.exchange.logsRepository.get("*", createdAt, Date.now());

			expect(get.length).to.be.equal(50);
			expect(get[0].createdAt).to.be.equal(createdAt);
			expect(get[49].createdAt).to.be.equal(59000);

			get = await mesh.exchange.logsRepository.get("*", 30000);

			expect(get.length).to.be.equal(30);
			expect(get[0].createdAt).to.be.equal(30000);
			expect(get[29].createdAt).to.be.equal(59000);

			await mesh.stop();
			expect(mesh._mesh.stopped).to.be.true;
		});

		it("it can add logs to the Logs Repository and get them with TO and FROM", async () => {
			const createdAt = 10000;
			await mesh.exchange.logsRepository.delete("*");

			for (let l = 0; l < 50; l++) {
				let logmodel = new LogModel();
				const sect = l * 1000;
				logmodel.setId({ logType: "TESTER", serial: 44, typeId: 3, createdAt: createdAt + sect });
				logmodel.setEvents[({ event: 1 }, { event: 2 })];

				await mesh.exchange.logsRepository.set(logmodel);
			}

			let get = await mesh.exchange.logsRepository.get("*", createdAt, 59000);

			expect(get.length).to.be.equal(50);
			expect(get[0].createdAt).to.be.equal(createdAt);
			expect(get[49].createdAt).to.be.equal(59000);

			get = await mesh.exchange.logsRepository.get("*", 20000, 30000);

			expect(get.length).to.be.equal(11);
			expect(get[0].createdAt).to.be.equal(20000);
			expect(get[10].createdAt).to.be.equal(30000);

			await mesh.stop();
			expect(mesh._mesh.stopped).to.be.true;
		});
	});
});
