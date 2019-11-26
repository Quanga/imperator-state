// const { CBoosterModel } = require("../../../lib/models/unitModels");
// const chai = require("chai");
// const expect = chai.expect;
// chai.use(require("chai-match"));
// const sinon = require("sinon");
// const sinonChai = require("sinon-chai");
// const chaiPromise = require("chai-as-promised");

// chai.use(sinonChai);
// chai.use(chaiPromise);

// const util = require("../../helpers/utils");
// const { unitModelEvents } = require("../../../lib/constants/eventConstants");

// //NOTE - for the test to work the ENV variable
// describe("UNIT - Models", async function() {
// 	this.timeout(10000);

// 	context("UnitModel", async () => {
// 		before(() => {
// 			process.env.COMMUNICATION_CHECK_INTERVAL = 4000;
// 		});

// 		it("creates a timer on the CBB which checks comms and will timeout if not reset", async () => {
// 			let testModel = new CBoosterModel(1, 33);

// 			const emitSpy = sinon.spy(testModel.event, "emit");
// 			testModel.setLastCommunication();

// 			await util.timer(5000);

// 			expect(emitSpy).to.have.been.calledOnce;
// 			console.log(emitSpy.getCall(0).args);
// 		});

// 		it("creates a timer on the CBB which checks will not emit if reset", async () => {
// 			let testModel = new CBoosterModel(1, 33);
// 			testModel.data.modifiedAt = Date.now();

// 			const emitSpy = sinon.spy(testModel.event, "emit");
// 			testModel.setLastCommunication();

// 			await util.timer(3000);

// 			testModel.setLastCommunication();
// 			expect(testModel.data.communicationStatus).to.be.equal(1);

// 			await util.timer(3000);

// 			expect(emitSpy).not.to.have.been.calledOnce;

// 			await util.timer(3000);
// 			expect(emitSpy).to.have.been.calledOnce;
// 			let call = emitSpy.getCall(0).args;
// 			expect(call[0]).to.be.equal(unitModelEvents.UNIT_COMM_LOST);
// 			expect(call[1].data).to.exist;
// 			expect(call[1].data.communicationStatus).to.be.equal(0);
// 			expect(call[2]).to.be.equal(
// 				testModel.data.modifiedAt + parseInt(process.env.COMMUNICATION_CHECK_INTERVAL)
// 			);
// 			expect(testModel.data.communicationStatus).to.be.equal(0);
// 		});
// 	});
// });
