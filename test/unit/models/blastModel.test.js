const BlastModel = require("../../../lib/models/blastModel");
const Mock = require("../../mocks/mock_happn");
const expect = require("expect.js");

describe("UNIT - BLASTMODEL TESTS", async function() {
	this.timeout(25000);

	const timer = duration =>
		new Promise(resolve => {
			setTimeout(() => {
				resolve();
			}, duration);
		});

	it("can create a new blastModel with a 5second report time", async function() {
		const created = Date.now();
		/***
         blastUnits: {},
				excludedUnits: {},
				disarmedUnits: {}
         */

		const snapshot = {
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
						"1": { data: { serial: 21 } },
						"2": { data: { serial: 31 } }
					}
				},
				"156": {
					data: { serial: 156, keySwitchStatus: 0 },
					units: { unitsCount: 0 }
				}
			}
		};

		const reportTime = 5000;

		const blastModel = new BlastModel(snapshot, created, reportTime);

		expect(blastModel.data.state).to.eql("BLAST_FIRING");
		expect(blastModel.data.snapshots.start.controlUnit.data.serial).to.eql(42);
		expect(blastModel.data.snapshots.start.excludedUnits["115"].data.serial).to.eql(115);
		expect(blastModel.data.snapshots.start.blastUnits["123"].data.serial).to.eql(123);
		expect(blastModel.data.snapshots.start.disarmedUnits["156"].data.serial).to.eql(156);

		await timer(6000);
		expect(blastModel.data.state).to.eql("BLAST_TIMER_COMPLETE");
		//console.log(JSON.stringify(blastModel, null, 4));
	});

	it("can stop a blast when all dets and units return and not use timeout", async function() {
		const mock = new Mock();
		const created = Date.now();

		const snapshot = {
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

		const reportTime = 60000;

		const blastModel = new BlastModel(mock, snapshot, created, reportTime);

		expect(blastModel.data.state).to.eql("BLAST_FIRING");
		expect(blastModel.blastWatch.watchUnits[0]).to.eql("123");

		await timer(1000);

		let logObj = {
			serial: 123,
			typeId: 3,
			path: "0/123",
			modified: Date.now(),
			changes: { communicationState: 1 },
			counts: {},
			windowId: null
		};

		blastModel.addLog({ value: logObj });

		expect(blastModel.blastWatch.watchUnits.length).to.eql(0);
		expect(blastModel.blastWatch.watchDets[123].length).to.eql(2);

		logObj = {
			serial: null,
			typeId: 4,
			path: null,
			parentSerial: 123,
			modified: Date.now(),
			changes: { communicationState: 1 },
			counts: {},
			windowId: 1
		};

		blastModel.addLog({ value: logObj });

		await timer(300);

		logObj = {
			serial: null,
			typeId: 4,
			path: null,
			parentSerial: 123,

			modified: Date.now(),
			changes: { communicationState: 1 },
			counts: {},
			windowId: 2
		};

		blastModel.addLog({ value: logObj });

		await timer(1000);
		//console.log(JSON.stringify(await blastModel.getBlastReport(), null, 4));
		expect(blastModel.data.state).to.eql("BLAST_DATA_COMPLETE");
	});

	it("leaving one det it will cause report to use the timeout rather", async function() {
		const mock = new Mock();
		const created = Date.now();

		const snapshot = {
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

		const reportTime = 10000;

		const blastModel = new BlastModel(mock, snapshot, created, reportTime);

		//console.log(blastModel.emitter.emit);
		const holdUntil = () =>
			new Promise(resolve => {
				blastModel.emitter.emitter.on("BLAST_TIMER_COMPLETE", () => {
					console.log("BLAST_DATA_COMPLETE");
					resolve();
				});
			});

		expect(blastModel.data.state).to.eql("BLAST_FIRING");
		expect(blastModel.blastWatch.watchUnits[0]).to.eql("123");

		await timer(1000);

		let logObj = {
			serial: 123,
			typeId: 3,
			path: "0/123",
			modified: Date.now(),
			changes: { communicationState: 1 },
			counts: {},
			windowId: null
		};

		blastModel.addLog({ value: logObj });

		expect(blastModel.blastWatch.watchUnits.length).to.eql(0);
		expect(blastModel.blastWatch.watchDets[123].length).to.eql(2);

		logObj = {
			serial: null,
			typeId: 4,
			path: null,
			parentSerial: 123,
			modified: Date.now(),
			changes: { communicationState: 1 },
			counts: {},
			windowId: 1
		};

		blastModel.addLog({ value: logObj });

		await timer(1000);

		await holdUntil();
		console.log(JSON.stringify(await blastModel.getBlastReport(), null, 4));
		expect(blastModel.data.state).to.eql("BLAST_TIMER_COMPLETE");
	});

	it("a log with a modified time later than the blast completed will stop the blast", async function() {
		const mock = new Mock();
		const created = Date.now();

		const snapshot = {
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

		const reportTime = 10000;

		const blastModel = new BlastModel(mock, snapshot, created, reportTime);

		//console.log(blastModel.emitter.emit);
		// const holdUntil = () =>
		// 	new Promise(resolve => {
		// 		blastModel.emitter.emitter.on("BLAST_TIMER_COMPLETE", () => {
		// 			console.log("BLAST_DATA_COMPLETE");
		// 			resolve();
		// 		});
		// 	});

		expect(blastModel.data.state).to.eql("BLAST_FIRING");
		expect(blastModel.blastWatch.watchUnits[0]).to.eql("123");

		await timer(1000);

		let logObj = {
			serial: 123,
			typeId: 3,
			path: "0/123",
			modified: Date.now(),
			changes: { communicationState: 1 },
			counts: {},
			windowId: null
		};

		blastModel.addLog({ value: logObj });

		expect(blastModel.blastWatch.watchUnits.length).to.eql(0);
		expect(blastModel.blastWatch.watchDets[123].length).to.eql(2);

		logObj = {
			serial: null,
			typeId: 4,
			path: null,
			parentSerial: 123,
			modified: Date.now() + 20000,
			changes: { communicationState: 1 },
			counts: {},
			windowId: 1
		};

		blastModel.addLog({ value: logObj });

		await timer(1000);

		//await holdUntil();
		console.log(JSON.stringify(await blastModel.getBlastReport(), null, 4));
		expect(blastModel.data.state).to.eql("BLAST_TIMER_COMPLETE");
	});
});
