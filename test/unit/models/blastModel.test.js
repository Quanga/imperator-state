const chai = require("chai");
const expect = chai.expect;
chai.use(require("chai-match"));

const util = require("../../helpers/utils");

const BlastModel = require("../../../lib/models/blastModel");
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

			const blastModel = BlastModel.create(createdAt)
				.withId("test1")
				.withTimer("firing", 3000)
				.withTimer("reporting", 3000)
				.withSnapshot(startSnapshot)
				.start();

			await util.timer(2000);
			expect(blastModel.times.initiate).to.be.equal(createdAt);
			expect(blastModel.times.totalDuration).to.be.equal(6000);
			expect(blastModel.watchLists).to.exist;
			expect(blastModel.watchLists.units["123"]).to.be.a("array");
		});

		it("can create a new blastModel with a 5 second report time", async function() {
			const createdAt = Date.now();

			const blastModel = BlastModel.create(createdAt)
				.withId("test1")
				.withTimer("firing", 5000)
				.withTimer("reporting", 5000)
				.withSnapshot(startSnapshot)
				.on("state", state => {
					console.log(state);
				})
				.on("log", log => console.log(log))
				.withFSM(blastsConfig.fsm)
				.start();

			await util.timer(5000);

			expect(blastModel.state.currentState.value).to.be.equal("firing");
			expect(blastModel.meta.createdAt).to.be.equal(createdAt);

			blastModel.toggleState({
				state: { operation: "firing_complete" },
				createdAt: createdAt + 1000,
			});

			await util.timer(2000);

			expect(blastModel.state.currentState.context.firingComplete).to.be.equal(createdAt + 1000);
			expect(blastModel.watchLists.count).to.be.equal(1);

			expect(blastModel.data.snapshots.start.controlUnit.meta.serial).to.be.equal(42);
			//expect(blastModel.data.snapshots.start.excluded["115"].meta.serial).to.be.equal(115);
			expect(blastModel.data.snapshots.start.active["123"].meta.serial).to.be.equal(123);
			expect(blastModel.data.snapshots.start.inactive["156"].meta.serial).to.be.equal(156);

			await util.timer(8000);

			expect(blastModel.state.currentState.value).to.eql("closed");
			expect(blastModel.state.currentState.context.blastClosed).to.be.equal(createdAt + 10000);
			expect(blastModel.state.currentState.context.method).to.be.equal("timer_completed");
		});

		it("can stop a blast when all dets and units return and not use timeout", async function() {
			const createdAt = Date.now();

			const blastModel = BlastModel.create(createdAt)
				.withTimer("firing", 1000)
				.withTimer("reporting", 5000)
				.withSnapshot(startSnapshot)
				.on("state", state => {
					console.log(state);
				})
				.on("log", log => console.log(log))
				.withFSM(blastsConfig.fsm)
				.start();

			await util.timer(500);

			expect(blastModel.state.currentState.value).to.eql("firing");
			expect(blastModel.watchLists.units).to.exist;

			await util.timer(1000);

			blastModel.toggleState({
				state: { operation: "firing_complete" },
				createdAt: createdAt + 1000,
			});

			await util.timer(1000);

			expect(blastModel.state.currentState.value).to.eql("watching");
			expect(blastModel.state.currentState.context.firingComplete).to.be.equal(createdAt + 1000);

			expect(blastModel.watchLists.units["123"]).to.exist;
			expect(blastModel.watchLists.units["123"].length).to.be.equal(2);

			await util.timer(500);

			let logObj = {
				meta: {
					logType: "eventService/UNIT_UPDATE",
					serial: 123,
					typeId: 3,
					createdAt: createdAt + 1000,
				},
				data: {
					events: { "3": [{ diff: { communicationState: 1 } }] },
				},
			};

			blastModel.addLog(logObj);

			expect(blastModel.watchLists.units["123"]).to.exist;
			expect(blastModel.watchLists.units["123"].length).to.be.equal(2);

			logObj = {
				meta: {
					logType: "eventService/UNIT_UPDATE",
					serial: 123,
					typeId: 3,
					createdAt: createdAt + 2000,
				},
				data: {
					events: { "4": [{ meta: { windowId: 1 }, diff: { connectionStatus: 1 } }] },
				},
			};

			blastModel.addLog(logObj);

			await util.timer(1000);
			expect(blastModel.watchLists.units["123"].length).to.be.equal(1);

			logObj = {
				meta: {
					logType: "eventService/UNIT_UPDATE",
					serial: 123,
					typeId: 3,
					createdAt: createdAt + 3000,
				},
				data: {
					events: { "4": [{ meta: { windowId: 2 }, diff: { connectionStatus: 1 } }] },
				},
			};

			blastModel.addLog(logObj);

			await util.timer(1000);
			expect(blastModel.watchLists.units["123"]).to.be.undefined;

			//console.log(JSON.stringify(await blastModel.getBlastReport(), null, 2));
			expect(blastModel.state.currentState.value).to.be.equal("closed");
			expect(blastModel.state.currentState.context.blastClosed).to.be.equal(createdAt + 3000);
		});

		it("leaving one det it will cause report to use the timeout rather", async function() {
			const createdAt = Date.now();

			const blastModel = BlastModel.create(createdAt)
				.withId("test1")
				.withTimer("firing", 1000)
				.withTimer("reporting", 5000)
				.withSnapshot(startSnapshot)
				.on("state", state => {
					console.log(state);
				})
				.on("log", log => console.log(log))
				.withFSM(blastsConfig.fsm)
				.start();

			const holdUntil = () =>
				new Promise(resolve => {
					blastModel.on("state", data => {
						if (data.state === "closed") {
							console.log("BLAST_DATA_COMPLETE");
							resolve();
						}
					});
				});

			expect(blastModel.state.currentState.value).to.eql("firing");
			expect(blastModel.watchLists.units).to.have.property("123");

			await util.timer(1000);

			blastModel.toggleState({
				state: { operation: "firing_complete" },
				createdAt: createdAt + 1000,
			});

			await util.timer(1000);

			let logObj = {
				meta: {
					logType: "eventService/DET_UPDATE",
					serial: 123,
					typeId: 3,
					createdAt: createdAt + 2000,
				},
				data: {
					events: { "4": [{ meta: { windowId: 1 }, diff: { detonatorStatus: 1 } }] },
				},
			};

			blastModel.addLog(logObj);

			expect(blastModel.watchLists.units["123"].length).to.eql(1);

			await util.timer(1000);

			await holdUntil();
			//console.log(JSON.stringify(await blastModel.getBlastReport(), null, 4));
			expect(blastModel.state.currentState.value).to.equal("closed");
			expect(blastModel.state.currentState.context.method).to.equal("timer_completed");
			expect(blastModel.state.currentState.context.blastClosed).to.be.equal(createdAt + 6000);
		});

		it("a log with a createdAt time later than the blast completed will stop the blast", async function() {
			const createdAt = Date.now();
			const blastModel = BlastModel.create(createdAt)
				.withId("test1")
				.withTimer("firing", 1000)
				.withTimer("reporting", 5000)
				.withSnapshot(startSnapshot)
				.on("state", state => {
					console.log(state);
				})
				.on("log", log => console.log(log))
				.withFSM(blastsConfig.fsm)
				.start();

			expect(blastModel.state.currentState.value).to.eql("firing");
			expect(blastModel.watchLists.units).to.have.property("123");
			expect(blastModel.watchLists.units[123].length).to.eql(2);

			await util.timer(1000);

			blastModel.toggleState({
				state: { operation: "firing_complete" },
				createdAt: createdAt + 1000,
			});

			await util.timer(1000);

			expect(blastModel.state.currentState.value).to.equal("watching");
			let logObj = {
				meta: {
					logType: "eventService/DET_UPDATE",
					serial: 123,
					typeId: 3,
					createdAt: createdAt + 15000,
				},
				data: {
					events: { "4": [{ meta: { windowId: 1 }, diff: { detonatorStatus: 1 } }] },
				},
			};

			blastModel.addLog(logObj);

			await util.timer(1000);

			expect(blastModel.state.currentState.value).to.be.equal("closed");
			expect(blastModel.state.currentState.context.blastClosed).to.be.equal(createdAt + 15000);
			expect(blastModel.state.currentState.context.method).to.be.equal("pseudo_data_completed");
			//expect(blastModel.timer).to.be.null;
		});
	});
});
