// eslint-disable-next-line no-unused-vars
const chai = require("chai");
const expect = chai.expect;
chai.use(require("chai-match"));
const asPromised = require("chai-as-promised");
chai.use(asPromised);
const sinon = require("sinon");
const sinonChai = require("sinon-chai");
const sandbox = sinon.createSandbox();

//const util = require("../../helpers/utils");

chai.use(sinonChai);

describe("UNIT - Components", async function() {
	this.timeout(20000);
	const SystemService = require("../../../lib/services/systemService");
	const systemService = new SystemService();
	const Mock = require("../../mocks/mock_happn");
	const mock = new Mock();
	mock.name = "systemService";

	beforeEach(() => {
		sandbox.restore();
	});

	context("System Service", async () => {
		it("can start the system Service - happn", async () => {
			await expect(systemService.componentStart(mock)).to.eventually.be.fulfilled;
		});

		it("will save a JSON file to the home folder", async () => {
			// $happn, timer, event, duration, callback
			let testObj = {
				test: 1,
				test2: 2,
				test3: 3
			};

			await systemService.writeJSON(mock, "test.json", testObj);
			//await expect(blast_service.componentStart(mock)).to.eventually.be.fulfilled;
		});
	});
});
