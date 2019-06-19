/* eslint-disable no-unused-vars */
const DataModel = require("../../../lib/models/dataModel");
const expect = require("expect.js");
const {
	ControlUnitModel,
	CBoosterModel,
	EDDModel
} = require("../../../lib/models/unitModels");

describe("UNIT - DATA MODEL TESTS", async function() {
	it("can create a new empty dataModel", async function() {
		const dataModel = new DataModel();

		expect(dataModel.controlUnit).to.eql(null);
	});

	it("can create a new  dataModel and add a ccb to it", async function() {
		const dataModel = new DataModel();
		const cu = new ControlUnitModel(22, null);

		await dataModel.upsertUnit(cu);

		expect(dataModel.controlUnit.data.serial).to.eql(22);
	});

	it("can create a new  dataModel and add a ccb and then 2 cbbs to it", async function() {
		const dataModel = new DataModel();
		const cu = new ControlUnitModel(22, null);
		const cbb1 = new CBoosterModel(101, 22);
		const cbb2 = new CBoosterModel(102, 22);

		let cuRes = await dataModel.upsertUnit(cu);
		let cbb1Res = await dataModel.upsertUnit(cbb1);
		await dataModel.upsertUnit(cbb2);

		//console.log("DATAMODEL", dataModel);
		console.log("cures", cuRes);
		console.log("cures2", cbb1Res);

		expect(dataModel.controlUnit.units.connectedUnitsCount).to.eql(2);
		expect(dataModel.units["101"].data.serial).to.eql(101);
		expect(dataModel.units["102"].data.serial).to.eql(102);
	});

	it("can create a new  dataModel and add a ccb and 2 cbbs and change value on ccb", async function() {
		const dataModel = new DataModel();
		const cu = new ControlUnitModel(22, null);
		const cbb1 = new CBoosterModel(101, 22);
		const cbb2 = new CBoosterModel(102, 22);

		await dataModel.upsertUnit(cu);
		await dataModel.upsertUnit(cbb1);
		await dataModel.upsertUnit(cbb2);

		const cuChange = new ControlUnitModel(22, null);
		cuChange.data.keySwitchStatus = 1;

		let changeObj = await dataModel.upsertUnit(cuChange);

		//console.log("CHANGE", changeObj);

		expect(dataModel.controlUnit.units.connectedUnitsCount).to.eql(2);
		expect(dataModel.units["101"].data.serial).to.eql(101);
		expect(dataModel.units["102"].data.serial).to.eql(102);
	});

	it("can create a new  dataModel and add a CCB and 2 CBBS and change value on CBB", async function() {
		const dataModel = new DataModel();
		const cu = new ControlUnitModel(22, null);
		const cbb1 = new CBoosterModel(101, 22);
		const cbb2 = new CBoosterModel(102, 22);

		await dataModel.upsertUnit(cu);
		await dataModel.upsertUnit(cbb1);
		await dataModel.upsertUnit(cbb2);

		expect(dataModel.controlUnit.units.unitsCount).to.eql(2);
		expect(dataModel.units["101"].data.serial).to.eql(101);
		expect(dataModel.units["102"].data.serial).to.eql(102);

		const ccb1Change = new CBoosterModel(101, null);
		ccb1Change.data.keySwitchStatus = 1;
		let changeObj = await dataModel.upsertUnit(ccb1Change);

		expect(dataModel.units["101"].data.keySwitchStatus).to.eql(1);
		expect(dataModel.controlUnit.units.keySwitchStatusCount).to.eql(1);

		const ccb1Change2 = new CBoosterModel(101, null);
		ccb1Change2.data.keySwitchStatus = 0;
		changeObj = await dataModel.upsertUnit(ccb1Change2);

		expect(dataModel.units["101"].data.keySwitchStatus).to.eql(0);
		expect(dataModel.controlUnit.units.keySwitchStatusCount).to.eql(0);

		console.log("CHANGE", changeObj);
	});

	it("can create a new  dataModel and add a CCB and 2 CBBS and add 2 EDDs", async function() {
		const dataModel = new DataModel();
		const cu = new ControlUnitModel(22, null);
		const cbb1 = new CBoosterModel(101, 22);
		const cbb2 = new CBoosterModel(102, 22);
		const edd1 = new EDDModel(null, 101, 1);
		edd1.meta.storedPacketDate = 76576576765;
		edd1.data.logged = 1;

		const edd2 = new EDDModel(null, 101, 2);

		await dataModel.upsertUnit(cu);
		await dataModel.upsertUnit(cbb1);
		await dataModel.upsertUnit(cbb2);
		await dataModel.upsertUnit(edd1);
		await dataModel.upsertUnit(edd2);
		//console.log("CHANGE", JSON.stringify(dataModel));

		expect(dataModel.controlUnit.units.unitsCount).to.eql(2);
		expect(dataModel.units["101"].data.serial).to.eql(101);
		expect(dataModel.units["102"].data.serial).to.eql(102);
		expect(dataModel.units["101"].units.unitsCount).to.eql(2);
		expect(dataModel.units["101"].units.programCount).to.eql(undefined);
		expect(dataModel.units["101"].units.loggedCount).to.eql(1);

		const edd1Change = new EDDModel(null, 101, 1);
		edd1Change.data.detonatorStatus = 1;
		edd1Change.data.serial = 2342342;
		let changedEdd = await dataModel.upsertUnit(edd1Change);
		//console.log("CHNGED EDD", JSON.stringify(changedEdd, null, 2));

		const edd2Change = new EDDModel(null, 101, 2);
		edd2Change.data.detonatorStatus = 1;
		edd2Change.data.logged = 1;
		edd2Change.data.serial = 3424234;
		await dataModel.upsertUnit(edd2Change);

		console.log("CHANGE", JSON.stringify(dataModel));
		expect(dataModel.units["101"].units.loggedCount).to.eql(2);
		expect(dataModel.units["101"].units.programmedCount).to.eql(0);
		expect(dataModel.units["101"].units.detonatorStatusCount).to.eql(2);

		// ccb1Change.data.keySwitchStatus = 1;
		// let changeObj = await dataModel.upsertUnit(ccb1Change);

		//expect(dataModel.units["101"].data.keySwitchStatus).to.eql(0);
	});

	it("can aggregate the cbb states into the control unit", async function() {
		const dataModel = new DataModel();

		await dataModel.upsertUnit(new ControlUnitModel(22, null));
		await dataModel.upsertUnit(new CBoosterModel(101, 22));
		await dataModel.upsertUnit(new CBoosterModel(102, 22));

		//console.log("CHANGE", JSON.stringify(dataModel));
		expect(dataModel.controlUnit.units.unitsCount).to.eql(2);
		expect(dataModel.controlUnit.units.keySwitchStatusCount).to.eql(0);
		expect(dataModel.controlUnit.units.communicationStatusCount).to.eql(2);

		let cbbUpdate = new CBoosterModel(101, 22);
		cbbUpdate.data.keySwitchStatus = 1;
		await dataModel.upsertUnit(cbbUpdate);

		expect(dataModel.controlUnit.units.unitsCount).to.eql(2);
		expect(dataModel.controlUnit.units.keySwitchStatusCount).to.eql(1);
		expect(dataModel.controlUnit.units.communicationStatusCount).to.eql(2);

		cbbUpdate = new CBoosterModel(102, 22);
		cbbUpdate.data.keySwitchStatus = 1;
		await dataModel.upsertUnit(cbbUpdate);

		expect(dataModel.controlUnit.units.unitsCount).to.eql(2);
		expect(dataModel.controlUnit.units.keySwitchStatusCount).to.eql(2);
		expect(dataModel.controlUnit.units.communicationStatusCount).to.eql(2);

		cbbUpdate = new CBoosterModel(102, 22);
		cbbUpdate.data.keySwitchStatus = 0;
		await dataModel.upsertUnit(cbbUpdate);

		expect(dataModel.controlUnit.units.unitsCount).to.eql(2);
		expect(dataModel.controlUnit.units.keySwitchStatusCount).to.eql(1);
		expect(dataModel.controlUnit.units.communicationStatusCount).to.eql(2);

		cbbUpdate = new CBoosterModel(102, 22);
		cbbUpdate.data.communicationStatus = 0;
		await dataModel.upsertUnit(cbbUpdate);

		expect(dataModel.controlUnit.units.unitsCount).to.eql(2);
		expect(dataModel.controlUnit.units.keySwitchStatusCount).to.eql(1);
		expect(dataModel.controlUnit.units.communicationStatusCount).to.eql(1);
	});

	it("can aggregate the edd states into the CBB unit", async function() {
		const dataModel = new DataModel();

		await dataModel.upsertUnit(new ControlUnitModel(22, null));
		await dataModel.upsertUnit(new CBoosterModel(101, 22));
		await dataModel.upsertUnit(new EDDModel(null, 101, 1));
		await dataModel.upsertUnit(new EDDModel(null, 101, 2));
		await dataModel.upsertUnit(new EDDModel(null, 101, 3));
		await dataModel.upsertUnit(new EDDModel(null, 101, 4));

		//console.log("CHANGE", JSON.stringify(dataModel));
		expect(dataModel.controlUnit.units.unitsCount).to.eql(1);
		expect(dataModel.controlUnit.units.keySwitchStatusCount).to.eql(0);
		expect(dataModel.units["101"].units.unitsCount).to.eql(4);

		let eddUpdate = new EDDModel(null, 101, 1);
		eddUpdate.data.detonatorStatus = 1;
		eddUpdate.data.logged = 1;
		await dataModel.upsertUnit(eddUpdate);

		expect(dataModel.units["101"].units.unitsCount).to.eql(4);
		expect(dataModel.units["101"].units.detonatorStatusCount).to.eql(1);
		expect(dataModel.units["101"].units.loggedCount).to.eql(1);

		eddUpdate = new EDDModel(null, 101, 1);
		eddUpdate.data.detonatorStatus = 0;
		eddUpdate.data.logged = 0;
		eddUpdate.data.tagged = 1;
		await dataModel.upsertUnit(eddUpdate);

		expect(dataModel.units["101"].units.unitsCount).to.eql(4);
		expect(dataModel.units["101"].units.detonatorStatusCount).to.eql(0);
		expect(dataModel.units["101"].units.loggedCount).to.eql(0);
		expect(dataModel.units["101"].units.taggedCount).to.eql(1);
	});
});
