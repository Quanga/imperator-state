const { CBoosterModel } = require("../../../lib/models/unitModels");
const expect = require("expect.js");

//NOTE - for the test to work the ENV variable
describe("Test the unitmodel functions", async function() {
	this.timeout(10000);

	before(() => {
		process.env.COMMUNICATION_CHECK_INTERVAL = 5000;
	});

	let timer = ms => {
		return new Promise(resolve => setTimeout(resolve, ms));
	};

	it("creates a timer on the CBB which checks comms", async function() {
		try {
			let testModel = new CBoosterModel(1, 33);
			testModel.setLastCommunication = new Date();
			await timer(5000);
			expect(testModel.data.communicationStatus).to.equal(0);
		} catch (err) {
			return Promise.reject(err);
		}
	});

	it("resets a timer on the CBB which checks comms", async function() {
		try {
			let testModel = new CBoosterModel(1, 33);
			testModel.setLastCommunication = new Date();
			await timer(5000);
			expect(testModel.data.communicationStatus).to.equal(0);

			await timer(500);
			testModel.setLastCommunication = new Date();
			await timer(1000);

			expect(testModel.data.communicationStatus).to.equal(1);
		} catch (err) {
			return Promise.reject(err);
		}
	});
});
