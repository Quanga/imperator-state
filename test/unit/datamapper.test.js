const DataMapper = require("../../lib/mappers/data_mapper");
const MockHappn = require("../mocks/mock_happn");
const expect = require("expect.js");

describe("DATA MAPPER TESTS", async function() {
	this.timeout(2000);
	it("can remap determine the changes in a node against its previous node", async function() {
		const datamapper = new DataMapper();

		const previous = {
			data: {
				serial: 13,
				parentSerial: null,
				typeId: 3,
				parentType: 0,
				created: 1560599359030,
				modified: 1560599359031,
				path: "3/13",
				communicationStatus: 1,
				blastArmed: 0,
				keySwitchStatus: 0,
				isolationRelay: 0,
				mains: 0,
				lowBat: 1,
				tooLowBat: 0,
				dcSupplyVoltage: 0,
				shaftFault: 0,
				cableFault: 0,
				earthLeakage: 0,
				ledState: 6,
				childCount: 2,
				loadCount: 2
			},
			meta: { storedPacketDate: 1312312312 }
		};

		const next = {
			data: {
				serial: 13,
				parentSerial: null,
				typeId: 3,
				parentType: 0,
				created: 1560599359030,
				modified: 1560599359031,
				path: "3/13",
				communicationStatus: 1,
				blastArmed: 0,
				keySwitchStatus: 1,
				isolationRelay: 0,
				mains: 0,
				lowBat: 1,
				tooLowBat: 0,
				dcSupplyVoltage: 0,
				shaftFault: 1,
				cableFault: 0,
				earthLeakage: 0,
				ledState: 6,
				childCount: 2,
				loadCount: 2
			},
			meta: { storedPacketDate: 231231231 }
		};

		let result = await datamapper.mapUpdateNode(next, previous);

		expect(result.meta.dirty.shaftFault).to.eql(1);
		expect(result.meta.dirty.keySwitchStatus).to.eql(1);
		//console.log(x);
	});

	it("can remap nulls in previous ", async function() {
		const datamapper = new DataMapper();

		const previous = {
			data: {
				serial: 13,
				parentSerial: null,
				typeId: 3,
				parentType: 0,
				created: 1560599359030,
				modified: 1560599359031,
				path: "3/13",
				communicationStatus: null,
				blastArmed: null,
				keySwitchStatus: null,
				isolationRelay: null,
				mains: 0,
				lowBat: 1,
				tooLowBat: 0,
				dcSupplyVoltage: 0,
				shaftFault: 0,
				cableFault: 0,
				earthLeakage: 0,
				ledState: 6,
				childCount: 2,
				loadCount: 2
			},
			meta: { storedPacketDate: 1312312312 }
		};

		const next = {
			data: {
				serial: 13,
				parentSerial: null,
				typeId: 3,
				parentType: 0,
				created: 1560599359030,
				modified: 1560599359031,
				path: "3/13",
				communicationStatus: 1,
				blastArmed: 0,
				keySwitchStatus: 1,
				isolationRelay: 0,
				mains: 0,
				lowBat: 1,
				tooLowBat: 0,
				dcSupplyVoltage: 0,
				shaftFault: 1,
				cableFault: 0,
				earthLeakage: 0,
				ledState: 6,
				childCount: 2,
				loadCount: 2
			},
			meta: { storedPacketDate: 231231231 }
		};

		let result = await datamapper.mapUpdateNode(next, previous);

		console.log(result);
		expect(result.meta.dirty.shaftFault).to.eql(1);
		expect(result.meta.dirty.keySwitchStatus).to.eql(1);
	});

	it("can remap null values against its previous node", async function() {
		const datamapper = new DataMapper();

		const previous = {
			data: {
				serial: 13,
				parentSerial: null,
				typeId: 3,
				parentType: 0,
				created: 1560599359030,
				modified: 1560599359031,
				path: "3/13",
				communicationStatus: 1,
				blastArmed: 0,
				keySwitchStatus: 0,
				isolationRelay: 0,
				mains: 0,
				lowBat: 1,
				tooLowBat: 0,
				dcSupplyVoltage: 0,
				shaftFault: 0,
				cableFault: 0,
				earthLeakage: 0,
				ledState: 6,
				childCount: 2,
				loadCount: 2
			},
			meta: { storedPacketDate: 1312312312 }
		};

		const next = {
			data: {
				serial: 13,
				parentSerial: null,
				typeId: 3,
				parentType: 0,
				created: 1560599359030,
				modified: 1560599359031,
				path: null,
				communicationStatus: 1,
				blastArmed: null,
				keySwitchStatus: null,
				isolationRelay: null,
				mains: null,
				lowBat: 1,
				tooLowBat: 0,
				dcSupplyVoltage: 0,
				shaftFault: 1,
				cableFault: 0,
				earthLeakage: 0,
				ledState: 6,
				childCount: 2,
				loadCount: 2
			},
			meta: { storedPacketDate: 231231231 }
		};

		let result = await datamapper.mapUpdateNode(next, previous);

		console.log(result);
		expect(result.data.mains).to.eql(0);
		expect(result.data.path).to.eql("3/13");
	});
});
