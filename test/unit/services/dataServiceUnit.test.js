const chai = require("chai");
const expect = chai.expect;
chai.use(require("chai-match"));
const sinon = require("sinon");
const sinonChai = require("sinon-chai");
const chaiPromise = require("chai-as-promised");

chai.use(sinonChai);
chai.use(chaiPromise);
const sandbox = sinon.createSandbox();

const DataModel = require("../../../lib/models/dataModel");
const Mock = require("../../mocks/mock_happn");
const DataService = require("../../../lib/services/data_service");

describe("UNIT - Services", async function() {
	context("DataService", async () => {
		let mock, dataService;
		process.env.MODE = "AXXIS100";

		beforeEach(async () => {
			mock = new Mock();
			dataService = new DataService();
			dataService.dataModel = DataModel.create().withMode(process.env.MODE);
		});

		afterEach(() => {
			sandbox.restore();
		});

		it("can create a context of INSERTS and UPDATES from a node Array ", async () => {
			const nodes = [
				{
					meta: { serial: 23, typeId: 0 },
					state: { communicationStatus: 1 },
					data: { keySwitchStatus: 1 },
					children: {},
					setPath: () => console.log("setting path"),
					withFSM: () => console.log("setting FSM"),
				},
				{
					meta: { serial: 34, typeId: 3 },
					state: { communicationStatus: 1 },
					data: [Object],
					func: {},
					setPath: () => console.log("setting path"),
					withFSM: () => console.log("setting FSM"),
				},
				{
					meta: { windowId: 34, typeId: 4, parentSerial: 34, parentType: 3 },
					state: { communicationStatus: 1 },
					data: [Object],
					func: {},
					setPath: () => console.log("setting path"),
					withFSM: () => console.log("setting FSM"),
				},
			];

			const returnContext = await dataService.createContext(mock, nodes);
			expect(returnContext.upserts.INSERT.length).to.be.equal(3);

			const updates = await dataService.commitUpdates(mock, returnContext);
			console.log(updates);
			console.log(dataService.dataModel.units);
		});
	});
});
