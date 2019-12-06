/* eslint-disable no-unused-vars */
var pako = require("pako");

const chai = require("chai");
const expect = chai.expect;
chai.use(require("chai-match"));
const sinon = require("sinon");
const sinonChai = require("sinon-chai");
chai.use(sinonChai);

const sandbox = sinon.createSandbox();

const Happner = require("happner-2");
require("dotenv").config({ path: `${__dirname}/.env.test` });
const config = require("../../../happner.config");

const simData = require("./simData.json");

describe("INTEGRATION - Repositories", async function() {
	this.timeout(10000);
	context("BlastRepository Tests", async () => {
		let mesh;

		beforeEach(async () => {
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

		it("it can compress a blastReport Object on saving", async () => {
			const save = await mesh.exchange.blastRepository.set({ blastEvent: { data: simData } });
			console.log(JSON.stringify(save));
			console.log(JSON.stringify(simData).length);
			//let snapshots = JSON.parse(pako.inflate(save.snapshots, { to: "string" }));
			//console.log(snapshots);
			console.log(JSON.stringify(save).length);
		});
	});
});
