// eslint-disable-next-line no-unused-vars
const chai = require("chai");
const expect = chai.expect;
chai.use(require("chai-match"));
const asPromised = require("chai-as-promised");
chai.use(asPromised);
const sinon = require("sinon");
const sinonChai = require("sinon-chai");
const sandbox = sinon.createSandbox();

const util = require("../../helpers/utils");

chai.use(sinonChai);

describe("UNIT - Components", async function() {
	this.timeout(20000);
	const BlastService = require("../../../lib/services/blast_service");
	const blastservice = new BlastService();
	const Mock = require("../../mocks/mock_happn");
	const mock = new Mock();
	mock.name = "queueService";

	beforeEach(() => {
		sandbox.restore();
	});

	context("Blast Service", async () => {
		it("can start the queueService - happn", async () => {
			await expect(blastservice.componentStart(mock)).to.eventually.be.fulfilled;
		});

		it("can start a blast timer of 10 seconds", async () => {
			// $happn, timer, event, duration, callback
			const complete = () => console.log("done");

			blastservice.startTimer(mock, "tester", "test", 10000, complete);
			//await expect(blast_service.componentStart(mock)).to.eventually.be.fulfilled;
			await util.timer(15000);
		});
	});
});