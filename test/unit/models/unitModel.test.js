const { CBoosterModel } = require("../../../lib/models/unitModels");
const chai = require("chai");
const expect = chai.expect;
chai.use(require("chai-match"));
const sinon = require("sinon");
const sinonChai = require("sinon-chai");
const chaiPromise = require("chai-as-promised");

chai.use(sinonChai);
chai.use(chaiPromise);

const util = require("../../helpers/utils");

//NOTE - for the test to work the ENV variable
describe("UNIT - Models", async function() {
	this.timeout(10000);

	context("UnitModel", async () => {
		before(() => {
			process.env.COMMUNICATION_CHECK_INTERVAL = 3000;
		});

		it("creates a timer on the CBB which checks comms", async () => {
			let testModel = new CBoosterModel(1, 33);
			const emitSpy = sinon.spy(testModel.event, "emit");
			testModel.setLastCommunication(new Date());
			await util.timer(5000);
			expect(emitSpy).to.have.been.calledOnce;
		});
	});
});
