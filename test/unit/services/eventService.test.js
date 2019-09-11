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
const EventService = require("../../../lib/services/event_service");

const LogModel = require("../../../lib/models/logModel");

const {
	dataServiceEvents,
	eventServiceLogTypes
} = require("../../../lib/constants/eventConstants");

describe("UNIT - Services", async function() {
	context("EventService", async () => {
		let mock, eventService, createdAt;

		beforeEach(() => {
			mock = new Mock();
			eventService = new EventService();
			eventService.emitQueue = [];
			createdAt = Date.now();
		});

		afterEach(() => {
			sandbox.restore();
		});

		it("can handle an EDD_SIG event sent from the DataService", async () => {
			const send = {
				type: dataServiceEvents.EDD_SIGNAL_DETECTED,
				serial: 34,
				createdAt,
				typeId: 3
			};

			const logSpy = sandbox.spy(mock.exchange.logsRepository, "set");
			await eventService.handleEvent(mock, send);
			expect(logSpy).to.have.been.calledOnce;

			const sentLog = logSpy.getCall(0).args[0];
			expect(sentLog).to.deep.equal({
				serial: 34,
				typeId: 3,
				createdAt,
				logType: eventServiceLogTypes.EDD_SIG
			});
			console.log();
		});

		it("can handle a UNIT INSERT event sent from the DataService", async () => {
			const send = {
				type: dataServiceEvents.UNITS_INSERTED,
				serial: 22,
				createdAt,
				typeId: 3,
				payload: [{ data: { serial: 22 } }]
			};

			const logSpy = sandbox.spy(mock.exchange.logsRepository, "set");
			await eventService.handleEvent(mock, send);
			expect(logSpy).to.have.been.calledOnce;

			const sentLog = logSpy.getCall(0).args[0];
			expect(sentLog).to.deep.equal({
				logType: eventServiceLogTypes.UNIT_INSERT,
				serial: 22,
				typeId: 3,
				createdAt
			});
			//console.log();
		});

		it("can handle a UNIT INSERT event sent from the DataService with diff", async () => {
			const send = {
				type: dataServiceEvents.UNITS_INSERTED,
				serial: 22,
				createdAt,
				typeId: 3,
				payload: [{ data: { serial: 22, typeId: 3 }, diff: { keyswitchStatus: 1 } }]
			};

			const logSpy = sandbox.spy(mock.exchange.logsRepository, "set");
			await eventService.handleEvent(mock, send);
			expect(logSpy).to.have.been.calledOnce;

			const sentLog = logSpy.getCall(0).args[0];
			expect(sentLog).to.deep.equal({
				logType: eventServiceLogTypes.UNIT_INSERT,
				serial: 22,
				typeId: 3,
				createdAt,
				events: [{ diff: { keyswitchStatus: 1 } }]
			});
		});

		it("can handle a DET INSERT event sent from the DataService", async () => {
			const send = {
				type: dataServiceEvents.UNITS_INSERTED,
				serial: 22,
				createdAt,
				typeId: 3,
				payload: [
					{ data: { serial: 44323344, typeId: 4, windowId: 1 } },
					{ data: { serial: 44323334, typeId: 4, windowId: 2 } }
				]
			};

			const logSpy = sandbox.spy(mock.exchange.logsRepository, "set");
			await eventService.handleEvent(mock, send);
			expect(logSpy).to.have.been.calledOnce;

			const sentLog = logSpy.getCall(0).args[0];
			expect(sentLog).to.deep.equal({
				logType: eventServiceLogTypes.DET_INSERT,
				serial: 22,
				typeId: 3,
				createdAt,
				events: [
					{ serial: 44323344, windowId: 1, ip: "2.164.82.16" },
					{ serial: 44323334, windowId: 2, ip: "2.164.82.6" }
				]
			});
		});

		it("can handle a UNIT UPDATE event sent from the DataService", async () => {
			const send = {
				type: dataServiceEvents.UNITS_UPDATED,
				serial: 22,
				createdAt,
				typeId: 3,
				payload: [{ data: { serial: 22 }, diff: { keySwitchStatus: 1 } }]
			};

			const logSpy = sandbox.spy(mock.exchange.logsRepository, "set");
			await eventService.handleEvent(mock, send);
			expect(logSpy).to.have.been.calledOnce;

			const sentLog = logSpy.getCall(0).args[0];
			expect(sentLog).to.deep.equal({
				logType: eventServiceLogTypes.UNIT_UPDATE,
				serial: 22,
				typeId: 3,
				createdAt,
				events: [{ serial: 22, diff: { keySwitchStatus: 1 } }]
			});
			//console.log();
		});

		it("can handle a DET UPDATE event sent from the DataService", async () => {
			const send = {
				type: dataServiceEvents.UNITS_UPDATED,
				serial: 22,
				createdAt,
				typeId: 3,
				payload: [
					{ data: { serial: 44323344, typeId: 4, windowId: 1 }, diff: { detonatorStatus: 0 } },
					{ data: { serial: 44323334, typeId: 4, windowId: 2 }, diff: { detonatorStatus: 0 } }
				]
			};

			const logSpy = sandbox.spy(mock.exchange.logsRepository, "set");
			await eventService.handleEvent(mock, send);
			expect(logSpy).to.have.been.calledOnce;

			const sentLog = logSpy.getCall(0).args[0];
			expect(sentLog).to.deep.equal({
				logType: eventServiceLogTypes.DET_UPDATE,
				serial: 22,
				typeId: 3,
				createdAt,
				events: [
					{ serial: 44323344, windowId: 1, diff: { detonatorStatus: 0 }, ip: "2.164.82.16" },
					{ serial: 44323334, windowId: 2, diff: { detonatorStatus: 0 }, ip: "2.164.82.6" }
				]
			});
		});

		it("can process a warning from an event object with 0 warnable events", async () => {
			const logModel = new LogModel();
			logModel.setId({
				logType: eventServiceLogTypes.UNIT_UPDATE,
				serial: 22,
				typeId: 3,
				createdAt
			});
			logModel.setEvents([{ diff: { keyswitchStatus: 1 } }]);

			let persistWarnSpy = sandbox.spy(mock.exchange.warningsRepository, "set");
			await eventService.processWarnings(mock, logModel);

			expect(persistWarnSpy).not.to.have.been.called;

			//expect(warnResult).to.deep.equal({});
		});

		it("can process a warning from an event object with 2 warnable events", async () => {
			const logModel = new LogModel();
			logModel.setId({
				logType: eventServiceLogTypes.UNIT_UPDATE,
				serial: 22,
				typeId: 3,
				createdAt
			});

			logModel.setEvents([{ diff: { keyswitchStatus: 1, cableFault: 1, earthLeakage: 1 } }]);

			let persistWarnSpy = sandbox.spy(mock.exchange.warningsRepository, "set");
			await eventService.processWarnings(mock, logModel);

			expect(persistWarnSpy).to.have.been.calledTwice;

			//expect(warnResult).to.deep.equal({});
		});

		it("can process a warning from an event object with 2 warnable events where one is 0", async () => {
			const logModel = new LogModel();
			logModel.setId({
				logType: eventServiceLogTypes.UNIT_UPDATE,
				serial: 22,
				typeId: 3,
				createdAt
			});

			logModel.setEvents([{ diff: { keyswitchStatus: 1, cableFault: 1, earthLeakage: 0 } }]);

			let persistWarnSpy = sandbox.spy(mock.exchange.warningsRepository, "set");
			await eventService.processWarnings(mock, logModel);

			const resp = {
				createdAt,
				serial: 22,
				typeId: 3,
				ack: false,
				//id: "ddda6273-1df5-4544-a0df-b54cbfe2f410",
				warning: "cableFault",
				ackDate: null,
				ackBy: null,
				ackType: null
			};

			expect(persistWarnSpy).to.have.been.calledOnce;
			let persistWarnResp = persistWarnSpy.getCall(0).args[0];
			delete persistWarnResp.id;

			expect(persistWarnResp).to.deep.equal(resp);

			console.log();

			//expect(warnResult).to.deep.equal({});
		});
	});
});
