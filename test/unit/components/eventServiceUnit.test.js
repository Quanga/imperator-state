// eslint-disable-next-line no-unused-vars
const chai = require("chai");
const expect = chai.expect;
chai.use(require("chai-match"));
const asPromised = require("chai-as-promised");
chai.use(asPromised);
const sinon = require("sinon");
const sinonChai = require("sinon-chai");
const sandbox = sinon.createSandbox();

chai.use(sinonChai);

const { dataServiceEvents } = require("../../../lib/constants/eventConstants");

describe("UNIT - Components", async function() {
	const EventService = require("../../../lib/services/event_service");
	const eventService = new EventService();
	const Mock = require("../../mocks/mock_happn");
	const mock = new Mock();
	mock.name = "queueService";

	beforeEach(() => {
		sandbox.restore();
	});

	context("EventService", async () => {
		it("will emit the update log for an EDD_SIG from DataService", async () => {
			let sig = {
				type: dataServiceEvents.EDD_SIGNAL_DETECTED,
				typeId: 3,
				createdAt: Date.now(),
				serial: 23
			};
			const logRepoSpy = sandbox.spy(mock.exchange.logsRepository, "set");
			eventService.emitQueue = [];
			await eventService.handleEvent(mock, sig);
			//console.log(JSON.stringify(eventService.emitQueue, null, 2));
			expect(logRepoSpy).to.have.been.called;
		});

		it("will emit the update log for an UNIT_UPDATE from dataService", async () => {
			let payload = [
				{
					data: {
						serial: 13,
						typeId: 3,
						parentType: 0,
						createdAt: 1567492898949,
						modifiedAt: 1567492898950,
						path: "3/13",
						communicationStatus: 1,
						blastArmed: 0,
						keySwitchStatus: 1,
						isolationRelay: 0,
						mains: 0,
						lowBat: 1,
						tooLowBat: 0,
						dcSupplyVoltage: 0,
						shaftFault: 0,
						lfs: 1,
						cableFault: 0,
						earthLeakage: 0,
						ledState: 6,
						childCount: 1
					},
					units: {
						unitsCount: 0,
						taggedCount: 0,
						loggedCount: 0,
						programCount: 0,
						detectedCount: 0,
						detonatorStatusCount: 0
					},
					event: {
						domain: null,
						_events: {},
						_eventsCount: 0
					},
					children: {},
					dataType: "data",
					diff: {
						blastArmed: 0,
						keySwitchStatus: 1,
						isolationRelay: 0,
						mains: 0,
						lowBat: 1,
						tooLowBat: 0,
						dcSupplyVoltage: 0,
						shaftFault: 0,
						lfs: 1,
						cableFault: 0,
						earthLeakage: 0,
						ledState: 6,
						childCount: 1
					}
				},
				{
					data: {
						serial: 4523434,
						typeId: 4,
						parentType: 3,
						createdAt: 1567492898949,
						modifiedAt: 1567492898950,
						path: "3/13/4/2",
						parentSerial: 13,
						detonatorStatus: 0,
						bridgeWire: 0,
						calibration: 0,
						program: 0,
						boosterFired: 0,
						tagged: 0,
						logged: 1,
						delay: 2000,
						windowId: 2
					},
					dataType: "data",
					diff: {
						detonatorStatus: 0,
						bridgeWire: 0,
						calibration: 0,
						program: 0,
						boosterFired: 0,
						tagged: 0,
						logged: 1,
						delay: 2000
					}
				},
				{
					data: {
						serial: 4523434,
						typeId: 4,
						parentType: 3,
						createdAt: 1567492898949,
						modifiedAt: 1567492898950,
						path: "3/13/4/2",
						parentSerial: 13,
						detonatorStatus: 0,
						bridgeWire: 0,
						calibration: 0,
						program: 0,
						boosterFired: 0,
						tagged: 0,
						logged: 1,
						delay: 2000,
						windowId: 2
					},
					dataType: "data",
					diff: {
						detonatorStatus: 0,
						bridgeWire: 0,
						calibration: 0,
						program: 0,
						boosterFired: 0,
						tagged: 0,
						logged: 1,
						delay: 2000
					}
				}
			];

			let sig = {
				type: dataServiceEvents.UNITS_UPDATED,
				typeId: 3,
				createdAt: Date.now(),
				serial: 13,
				payload
			};
			const logRepoSpy = sandbox.spy(mock.exchange.logsRepository, "set");
			eventService.emitQueue = [];
			await eventService.handleEvent(mock, sig);
			console.log(JSON.stringify(eventService.emitQueue, null, 2));
			expect(logRepoSpy).to.have.been.called;
		});

		it("will emit the INSERT log from the dataService", async () => {
			let payload = [
				{
					data: {
						serial: 4423425,
						typeId: 4,
						parentType: 3,
						createdAt: 1567495988879,
						modifiedAt: null,
						path: "3/12/4/35",
						parentSerial: 12,
						detonatorStatus: null,
						bridgeWire: null,
						calibration: null,
						program: null,
						boosterFired: null,
						tagged: null,
						logged: null,
						delay: null,
						windowId: 35
					},
					dataType: "list"
				},
				{
					data: {
						serial: 4523436,
						typeId: 4,
						parentType: 3,
						createdAt: 1567495988879,
						modifiedAt: null,
						path: "3/12/4/36",
						parentSerial: 12,
						detonatorStatus: null,
						bridgeWire: null,
						calibration: null,
						program: null,
						boosterFired: null,
						tagged: null,
						logged: null,
						delay: null,
						windowId: 36
					},
					dataType: "list"
				},
				{
					data: {
						serial: 4523437,
						typeId: 4,
						parentType: 3,
						createdAt: 1567495988879,
						modifiedAt: null,
						path: "3/12/4/37",
						parentSerial: 12,
						detonatorStatus: null,
						bridgeWire: null,
						calibration: null,
						program: null,
						boosterFired: null,
						tagged: null,
						logged: null,
						delay: null,
						windowId: 37
					},
					dataType: "list"
				}
			];

			let sig = {
				type: dataServiceEvents.UNITS_INSERTED,
				typeId: 3,
				createdAt: Date.now(),
				serial: 13,
				payload
			};
			const logRepoSpy = sandbox.spy(mock.exchange.logsRepository, "set");
			eventService.emitQueue = [];
			await eventService.handleEvent(mock, sig);
			console.log(JSON.stringify(eventService.emitQueue, null, 2));
			expect(logRepoSpy).to.have.been.called;
		});
	});
});

/*

*/
