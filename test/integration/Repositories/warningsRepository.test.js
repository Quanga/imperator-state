/* eslint-disable no-unused-vars */
const chai = require("chai");
const expect = chai.expect;
chai.use(require("chai-match"));
const sinon = require("sinon");
const sinonChai = require("sinon-chai");
chai.use(sinonChai);

const sandbox = sinon.createSandbox();

const Happner = require("happner-2");
const Config = require("../../../config");
const util = require("../../helpers/utils");
const WarningModel = require("../../../lib/models/warningModel");

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
	context("Warnings Tests", async () => {
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
		});

		afterEach(() => {
			sandbox.restore();
		});

		it("it can add warnings to the Warning Repository and get with no TO or FROM", async () => {
			const createdAt = 10000;
			for (let l = 0; l < 10; l++) {
				let warningModel = new WarningModel({
					createdAt: createdAt + l * 10,
					serial: 33,
					typeId: 3
				});
				warningModel.setWarning("test");
				await mesh.exchange.warningsRepository.set(warningModel);
			}
			await util.timer(1000);

			let get = await mesh.exchange.warningsRepository.get("*");

			console.log(get);
			expect(get.length).to.be.equal(10);
			expect(get[0].createdAt).to.be.equal(createdAt);
			expect(get[9].createdAt).to.be.equal(10090);

			await mesh.stop();
			expect(mesh._mesh.stopped).to.be.true;
		});

		it("it can get a warning by id from the warnings Repo", async () => {
			const createdAt = 10000;
			for (let l = 0; l < 10; l++) {
				let warningModel = new WarningModel({
					createdAt: createdAt + l * 10,
					serial: 33,
					typeId: 3
				});
				warningModel.setWarning("test");
				await mesh.exchange.warningsRepository.set(warningModel);
			}
			await util.timer(1000);

			let get = await mesh.exchange.warningsRepository.get("*");
			let id = get[4].id;
			console.log("ID is", id);

			let getItem = await mesh.exchange.warningsRepository.getById(id);

			getItem.ackBy = "tester user";

			delete getItem._meta;
			await mesh.exchange.warningsRepository.set(getItem);
			let res = await mesh.exchange.warningsRepository.get("*");
			console.log("res", res);

			expect(res.length).to.be.equal(10);
			expect(get[4].ackBy).to.be.null;
			expect(res[4].ackBy).to.be.equal("tester user");
			// expect(get[9].createdAt).to.be.equal(10090);

			await mesh.stop();
			expect(mesh._mesh.stopped).to.be.true;
		});
	});
});

/* 
            class WarningModel {
	constructor(eventObj) {
		this.createdAt = eventObj.createdAt;
		this.serial = eventObj.serial;
		this.typeId = eventObj.typeId;
		this.ack = false;
	}

	setWarning(warning) {
		this.id = uuid.v4();
		this.warning = warning;
		this.ackDate = null;
		this.ackBy = null;
		this.ackType = null;
	}
}
            */
