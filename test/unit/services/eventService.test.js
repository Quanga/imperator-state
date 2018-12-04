const expect = require("expect.js");

describe("EventService Tests", async () => {
	const MockHappn = require("../../mocks/mock_happn");
	const mockHappn = new MockHappn();

	const EventService = require("../../../lib/services/event_service");
	const eventService = new EventService();

	const {
		ControlUnitModel,
		SectionControlModel,
		BoosterModel,
		CBoosterModel
		//EDDModel
	} = require("../../../lib/models/unitModels");

	it("can initialize IBS units into the blastEvents", async () => {
		try {
			process.env.ROUTER_SYSYEM_TYPE = "IBS";
			let activeBooster = () => {
				let booster = new BoosterModel(33, 22);
				booster.data.key_switch_status = 1;
				return booster;
			};
			mockHappn.nodes = [
				new ControlUnitModel(12, null),
				new SectionControlModel(22, 12),
				new SectionControlModel(23, 12),
				activeBooster(),
				new BoosterModel(22, 23)
			];

			await eventService.initialise(mockHappn);

			let dataModel = eventService.dataModel;
			let blastModel = eventService.blastModel;

			console.log(blastModel.blastNodes);
			let length = dataModel.length;
			expect(length).to.equal(5);
			expect(blastModel.blastNodes.length).to.equal(4);
		} catch (err) {
			return Promise.reject(err);
		}
	});

	it("can initialize AXXIS units into the blastEvents", async () => {
		try {
			process.env.ROUTER_SYSYEM_TYPE = "AXXIS";
			let activeBooster = () => {
				let cbooster = new CBoosterModel(33, 12);
				cbooster.data.key_switch_status = 1;
				return cbooster;
			};
			mockHappn.nodes = [
				new ControlUnitModel(12, null),
				activeBooster(),
				new CBoosterModel(22, 12)
			];

			await eventService.initialise(mockHappn);

			let dataModel = eventService.dataModel;
			let blastModel = eventService.blastModel;

			console.log(blastModel.blastNodes);
			let length = dataModel.length;
			expect(length).to.equal(3);
			expect(blastModel.blastNodes.length).to.equal(2);
		} catch (err) {
			return Promise.reject(err);
		}
	});
});
