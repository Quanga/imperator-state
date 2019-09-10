const chai = require("chai");
const expect = chai.expect;
chai.use(require("chai-match"));

const util = require("../../helpers/utils");

const BlastModel = require("../../../lib/models/blastModel");
const { blastModelEvents, eventServiceLogTypes } = require("../../../lib/constants/eventConstants");
const { blastModelStates } = require("../../../lib/constants/stateConstants");

describe("UNIT - Models", async function() {
	this.timeout(25000);
	process.env.NODE_ENV = "test";

	context("BlastModel", async () => {
		const startSnapshot = {
			controlUnit: { data: { serial: 42 } },
			units: {
				"115": {
					data: { serial: 115, keySwitchStatus: 0 },
					units: { unitsCount: 12 }
				},
				"123": {
					data: { serial: 123, keySwitchStatus: 1 },
					units: { unitsCount: 2 },
					children: {
						"1": { data: { serial: 21, detonatorStatus: 1 } },
						"2": { data: { serial: 31, detonatorStatus: 1 } }
					}
				},
				"156": {
					data: { serial: 156, keySwitchStatus: 0 },
					units: { unitsCount: 0 }
				}
			}
		};
		it("will fail to create a BlastModel with no args", async () => {
			expect(() => new BlastModel()).to.throw(
				Error,
				"All arguments must be specified to create a Blast Model"
			);
		});

		it("can create a new blastModel with a 5 second report time", async function() {
			const createdAt = Date.now();
			const reportingDuration = 5000;
			const firingDuration = 1000;

			const blastModel = new BlastModel(
				startSnapshot,
				createdAt,
				firingDuration,
				reportingDuration
			);

			expect(blastModel.data.state).to.be.equal(blastModelStates.BLAST_FIRING);
			expect(blastModel.data.createdAt).to.be.equal(createdAt);

			let logObj = {
				logType: eventServiceLogTypes.UNIT_UPDATE,
				serial: 42,
				typeId: 0,
				createdAt: createdAt + 1000,
				events: [{ fireButton: 0 }]
			};
			await util.timer(1000);
			blastModel.addLog(logObj);
			await util.timer(1000);

			expect(blastModel.data.firingComplete).to.be.equal(createdAt + 1000);
			expect(blastModel.data.firingTime).to.be.equal(1000);
			expect(blastModel.watchLists.count).to.be.equal(1);

			expect(blastModel.data.snapshots.start.controlUnit.data.serial).to.be.equal(42);
			expect(blastModel.data.snapshots.start.excludedUnits["115"].data.serial).to.be.equal(115);
			expect(blastModel.data.snapshots.start.blastUnits["123"].data.serial).to.be.equal(123);
			expect(blastModel.data.snapshots.start.disarmedUnits["156"].data.serial).to.be.equal(156);

			await util.timer(7000);
			expect(blastModel.data.state).to.eql(blastModelStates.BLAST_TIMER_COMPLETE);
			expect(blastModel.data.blastClosed).to.be.equal(createdAt + 6000);
			expect(blastModel.data.blastReturnTime).to.be.equal(5000);
		});

		it("can stop a blast when all dets and units return and not use timeout", async function() {
			const createdAt = Date.now();
			const reportingDuration = 10000;
			const firingDuration = 1000;

			const blastModel = new BlastModel(
				startSnapshot,
				createdAt,
				firingDuration,
				reportingDuration
			);

			await util.timer(500);

			expect(blastModel.data.state).to.eql(blastModelStates.BLAST_FIRING);
			expect(blastModel.watchLists.units).to.exist;

			let logObj = {
				logType: eventServiceLogTypes.UNIT_UPDATE,
				serial: 42,
				typeId: 0,
				createdAt: createdAt + 1000,
				events: [{ fireButton: 0 }]
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
				events: [{ communicationState: 1 }]
			};

			blastModel.addLog(logObj);

			expect(blastModel.watchLists.units["123"]).to.exist;
			expect(blastModel.watchLists.units["123"].length).to.be.equal(2);

			logObj = {
				logType: eventServiceLogTypes.DET_UPDATE,
				serial: 123,
				typeId: 3,
				createdAt: createdAt + 2000,
				events: [{ windowId: 1, communicationState: 1 }]
			};

			blastModel.addLog(logObj);

			await util.timer(1000);
			expect(blastModel.watchLists.units["123"].length).to.be.equal(1);

			logObj = {
				logType: eventServiceLogTypes.DET_UPDATE,
				serial: 123,
				typeId: 3,
				createdAt: createdAt + 3000,
				events: [{ windowId: 2, communicationState: 1 }]
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

			const blastModel = new BlastModel(
				startSnapshot,
				createdAt,
				firingDuration,
				reportingDuration
			);

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
				events: [{ fireButton: 0 }]
			};

			await util.timer(1000);
			blastModel.addLog(logObj);
			await util.timer(1000);

			logObj = {
				logType: eventServiceLogTypes.DET_UPDATE,
				serial: 123,
				typeId: 3,
				createdAt: createdAt + 2000,
				events: [{ windowId: 1, communicationState: 1 }]
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

			const blastModel = new BlastModel(
				startSnapshot,
				createdAt,
				firingDuration,
				reportingDuration
			);

			expect(blastModel.data.state).to.eql(blastModelStates.BLAST_FIRING);
			expect(blastModel.watchLists.units).to.have.property("123");
			expect(blastModel.watchLists.units[123].length).to.eql(2);

			let logObj = {
				logType: eventServiceLogTypes.UNIT_UPDATE,
				serial: 42,
				typeId: 0,
				createdAt: createdAt + 1000,
				events: [{ fireButton: 0 }]
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
				events: [{ windowId: 1, communicationState: 1 }]
			};

			blastModel.addLog(logObj);

			await util.timer(1000);

			expect(blastModel.data.state).to.be.equal(blastModelStates.BLAST_TIMER_COMPLETE);
			expect(blastModel.data.blastClosed).to.be.equal(createdAt + 15000);
			expect(blastModel.data.blastReturnTime).to.be.equal(14000);
			expect(blastModel.timer).to.be.null;
		});
	});
});
