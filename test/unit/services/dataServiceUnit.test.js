const chai = require("chai");
const expect = chai.expect;
chai.use(require("chai-match"));
const sinon = require("sinon");
const sinonChai = require("sinon-chai");
const chaiPromise = require("chai-as-promised");

chai.use(sinonChai);
chai.use(chaiPromise);
const sandbox = sinon.createSandbox();

const Mock = require("../../mocks/mock_happn");
const DataService = require("../../../lib/services/data_service");

describe("UNIT - Services", async function() {
	context("DataService", async () => {
		let mock, dataService, createdAt;

		beforeEach(() => {
			mock = new Mock();
			dataService = new DataService();
		});

		afterEach(() => {
			sandbox.restore();
		});

		it("commitUpdates ", async () => {
			const nodes = [
				{
					meta: { serial: 23 },
					state: { communicationStatus: 1 },
					data: { keySwitchStatus: 1 },
					children: {},
				},
				{
					meta: { serial: 34 },
					state: { communicationStatus: 1 },
					data: [Object],
					func: {},
				},
			];

			const context = {
				upserts: { UPDATE: [], INSERT: [...nodes] },
				errors: [],
				none: [],
			};

			const test = dataService.commitUpdates(mock, context);
			// const send = {
			// 	type: dataServiceEvents.EDD_SIGNAL_DETECTED,
			// 	serial: 34,
			// 	createdAt,
			// 	typeId: 3,
			// };
			// const logSpy = sandbox.spy(mock.exchange.logsRepository, "set");
			// await eventService.handleEvent(mock, send);
			// expect(logSpy).to.have.been.calledOnce;
			// const sentLog = logSpy.getCall(0).args[0];
			// expect(sentLog).to.deep.equal({
			// 	serial: 34,
			// 	typeId: 3,
			// 	createdAt,
			// 	logType: eventServiceLogTypes.EDD_SIG,
			// });
			// console.log();
		});
	});
});
