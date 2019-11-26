const chai = require("chai");
const expect = chai.expect;
chai.use(require("chai-match"));

const util = require("../../helpers/utils");

const BlastModel = require("../../../lib/models/blastModel");
const { blastModelEvents } = require("../../../lib/constants/eventConstants");
const { blastModelStates } = require("../../../lib/configs/states/stateConstants");
const { eventServiceLogTypes } = require("../../../lib/constants/typeConstants");
const blastsConfig = require("../../../lib/configs/blasts/blastsConfig");

describe("UNIT - Models", async function() {
	this.timeout(25000);
	process.env.NODE_ENV = "test";

	context("BlastModel", async () => {
		const startSnapshot = {
			"0": { meta: { serial: 42 }, data: {} },
			"3": {
				"115": {
					meta: { serial: 115 },
					data: { keySwitchStatus: 0 },
					state: { communicationStatus: 1 },
					counts: { unitsCount: 12 },
					children: {},
				},
				"123": {
					meta: { serial: 123 },
					data: { keySwitchStatus: 1 },
					counts: { keySwitchStatus: 2 },
					state: { communicationStatus: 1 },
					children: { "4": [1, 2] },
				},

				"156": {
					meta: { serial: 156 },
					data: { keySwitchStatus: 0 },
					counts: { communicationStatus: 0 },
					state: { communicationStatus: 1 },
					children: {},
				},
			},

			"4": {
				"123": {
					"1": {
						meta: { serial: 21, windowId: 1 },
						data: { communicationStatus: 1 },
						state: { communicationStatus: 1 },
					},
					"2": {
						meta: { serial: 31, windowId: 2 },
						data: { communicationStatus: 1 },
						state: { communicationStatus: 1 },
					},
				},
			},
		};
		it("can create a watchList from a snapshot", async function() {
			const createdAt = Date.now();
			const opts = { reportingDuration: 5000, firingDuration: 1000 };

			const blastModel = BlastModel.create(createdAt)
				.withOpts(opts)
				.withSnapshot(startSnapshot);

			await util.timer(2000);
			console.log(blastModel);
		});

		it("can create a new blastModel with a 5 second report time", async function() {
			const createdAt = Date.now();
			const opts = { reportingDuration: 5000, firingDuration: 1000 };

			const blastModel = BlastModel.create(createdAt)
				.withOpts(opts)
				.withSnapshot(startSnapshot)
				.on("state", state => {
					console.log(state);
				})
				.on("log", log => console.log(log))
				.withFSM(blastsConfig.fsm)
				.start();

			await util.timer(5000);

			//expect(blastModel.data.state).to.be.equal(blastModelStates.BLAST_FIRING);
			expect(blastModel.meta.createdAt).to.be.equal(createdAt);

			let logObj = {
				logType: eventServiceLogTypes.UNIT_UPDATE,
				serial: 42,
				typeId: 0,
				createdAt: createdAt + 1000,
				events: [{ diff: { fireButton: 0 } }],
			};

			blastModel.addLog(logObj);
			await util.timer(1000);

			expect(blastModel.times.firingComplete).to.be.equal(createdAt + 1000);
			expect(blastModel.times.firingTime).to.be.equal(1000);
			expect(blastModel.watchLists.count).to.be.equal(1);

			expect(blastModel.data.snapshots.start.controlUnit.meta.serial).to.be.equal(42);
			//expect(blastModel.data.snapshots.start.excluded["115"].meta.serial).to.be.equal(115);
			expect(blastModel.data.snapshots.start.active["123"].meta.serial).to.be.equal(123);
			expect(blastModel.data.snapshots.start.inactive["156"].meta.serial).to.be.equal(156);

			await util.timer(7000);
			expect(blastModel.state.currentState).to.eql(closed);
			expect(blastModel.times.blastClosed).to.be.equal(createdAt + 6000);
			expect(blastModel.times.blastReturnTime).to.be.equal(5000);
		});

		it("can stop a blast when all dets and units return and not use timeout", async function() {
			const createdAt = Date.now();
			const reportingDuration = 10000;
			const firingDuration = 1000;

			const blastModel = new BlastModel(startSnapshot, createdAt, firingDuration, reportingDuration);

			await util.timer(500);

			expect(blastModel.data.state).to.eql(blastModelStates.BLAST_FIRING);
			expect(blastModel.watchLists.units).to.exist;

			let logObj = {
				logType: eventServiceLogTypes.UNIT_UPDATE,
				serial: 42,
				typeId: 0,
				createdAt: createdAt + 1000,
				events: [{ diff: { fireButton: 0 } }],
			};

			await util.timer(1000);
			blastModel.addLog(logObj);
			await util.timer(1000);

			expect(blastModel.data.state).to.eql(blastModelStates.BLAST_FIRED);
			expect(blastModel.data.firingComplete).to.be.equal(createdAt + 1000);
			expect(blastModel.data.firingTime).to.be.equal(1000);

			expect(blastModel.watchLists.units["123"]).to.exist;
			expect(blastModel.watchLists.units["123"].length).to.be.equal(2);

			await util.timer(500);

			logObj = {
				logType: eventServiceLogTypes.UNIT_UPDATE,
				serial: 123,
				typeId: 3,
				createdAt: createdAt + 1000,
				events: [{ diff: { communicationState: 1 } }],
			};

			blastModel.addLog(logObj);

			expect(blastModel.watchLists.units["123"]).to.exist;
			expect(blastModel.watchLists.units["123"].length).to.be.equal(2);

			logObj = {
				logType: eventServiceLogTypes.DET_UPDATE,
				serial: 123,
				typeId: 3,
				createdAt: createdAt + 2000,
				events: [{ windowId: 1, diff: { detonatorStatus: 1 } }],
			};

			blastModel.addLog(logObj);

			await util.timer(1000);
			expect(blastModel.watchLists.units["123"].length).to.be.equal(1);

			logObj = {
				logType: eventServiceLogTypes.DET_UPDATE,
				serial: 123,
				typeId: 3,
				createdAt: createdAt + 3000,
				events: [{ windowId: 2, diff: { detonatorStatus: 1 } }],
			};

			blastModel.addLog(logObj);

			await util.timer(1000);
			expect(blastModel.watchLists.units["123"]).to.be.undefined;

			//console.log(JSON.stringify(await blastModel.getBlastReport(), null, 2));
			expect(blastModel.data.state).to.be.equal(blastModelStates.BLAST_DATA_COMPLETE);
			expect(blastModel.data.blastClosed).to.be.equal(createdAt + 3000);
			expect(blastModel.data.blastReturnTime).to.be.equal(2000);
		});

		it("leaving one det it will cause report to use the timeout rather", async function() {
			const createdAt = Date.now();
			const reportingDuration = 10000;
			const firingDuration = 1000;

			const blastModel = new BlastModel(startSnapshot, createdAt, firingDuration, reportingDuration);

			const holdUntil = () =>
				new Promise(resolve => {
					blastModel.event.on(blastModelEvents.BLASTMODEL_LOG, data => {
						if (data === blastModelStates.BLAST_TIMER_COMPLETE) {
							console.log("BLAST_DATA_COMPLETE");
							resolve();
						}
					});
				});

			expect(blastModel.data.state).to.eql(blastModelStates.BLAST_FIRING);
			expect(blastModel.watchLists.units).to.have.property("123");

			let logObj = {
				logType: eventServiceLogTypes.UNIT_UPDATE,
				serial: 42,
				typeId: 0,
				createdAt: createdAt + 1000,
				events: [{ diff: { fireButton: 0 } }],
			};

			await util.timer(1000);
			blastModel.addLog(logObj);
			await util.timer(1000);

			logObj = {
				logType: eventServiceLogTypes.DET_UPDATE,
				serial: 123,
				typeId: 3,
				createdAt: createdAt + 2000,
				events: [{ windowId: 1, diff: { detonatorStatus: 1 } }],
			};

			blastModel.addLog(logObj);

			expect(blastModel.watchLists.units["123"].length).to.eql(1);

			await util.timer(1000);

			await holdUntil();
			//console.log(JSON.stringify(await blastModel.getBlastReport(), null, 4));
			expect(blastModel.data.state).to.eql(blastModelStates.BLAST_TIMER_COMPLETE);
			expect(blastModel.data.blastClosed).to.be.equal(createdAt + 11000);
			expect(blastModel.data.blastReturnTime).to.be.equal(10000);
		});

		it("a log with a createdAt time later than the blast completed will stop the blast", async function() {
			const createdAt = Date.now();
			const reportingDuration = 10000;
			const firingDuration = 1000;

			const blastModel = new BlastModel(startSnapshot, createdAt, firingDuration, reportingDuration);

			expect(blastModel.data.state).to.eql(blastModelStates.BLAST_FIRING);
			expect(blastModel.watchLists.units).to.have.property("123");
			expect(blastModel.watchLists.units[123].length).to.eql(2);

			let logObj = {
				logType: eventServiceLogTypes.UNIT_UPDATE,
				serial: 42,
				typeId: 0,
				createdAt: createdAt + 1000,
				events: [{ diff: { fireButton: 0 } }],
			};

			await util.timer(1000);
			blastModel.addLog(logObj);
			await util.timer(1000);

			expect(blastModel.data.state).to.eql(blastModelStates.BLAST_FIRED);
			logObj = {
				logType: eventServiceLogTypes.DET_UPDATE,
				serial: 123,
				typeId: 3,
				createdAt: createdAt + 15000,
				events: [{ windowId: 1, diff: { detonatorStatus: 1 } }],
			};

			blastModel.addLog(logObj);

			await util.timer(1000);

			expect(blastModel.data.state).to.be.equal(blastModelStates.BLAST_TIMER_COMPLETE_BYPACKET);
			expect(blastModel.data.blastClosed).to.be.equal(createdAt + 15000);
			expect(blastModel.data.blastReturnTime).to.be.equal(14000);
			expect(blastModel.timer).to.be.null;
		});
	});
});
