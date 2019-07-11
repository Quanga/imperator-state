/* eslint-disable no-unused-vars */
const DataModel = require("../../../lib/models/dataModel");
const expect = require("expect.js");
const {
	ControlUnitModel,
	CBoosterModel,
	EDDModel
} = require("../../../lib/models/unitModels");

describe("UNIT - DATA MODEL TESTS", async function() {
	const timer = duration =>
		new Promise((resolve, reject) => {
			setTimeout(() => {
				resolve();
			}, duration);
		});

	it("can create a new empty dataModel", async function() {
		const dataModel = new DataModel();

		expect(dataModel.controlUnit).to.eql(null);
	});

	it("can create a new  dataModel and add a ccb to it", async function() {
		const dataModel = new DataModel();
		const cu = new ControlUnitModel(22);

		await dataModel.upsertUnit(cu);

		expect(dataModel.controlUnit.data.serial).to.eql(22);
	});

	it("can create a new  dataModel and add a ccb and then 2 cbbs to it", async function() {
		const dataModel = new DataModel();
		const cu = new ControlUnitModel(22);
		const cbb1 = new CBoosterModel(101);
		const cbb2 = new CBoosterModel(102);

		let cuRes = await dataModel.upsertUnit(cu);
		let cbb1Res = await dataModel.upsertUnit(cbb1);
		await dataModel.upsertUnit(cbb2);

		//console.log("DATAMODEL", dataModel);

		expect(dataModel.controlUnit.units.unitsCount).to.eql(2);
		expect(dataModel.units["101"].data.serial).to.eql(101);
		expect(dataModel.units["102"].data.serial).to.eql(102);
	});

	it("can create a new  dataModel and add a ccb and 2 cbbs and change value on ccb", async function() {
		const dataModel = new DataModel();
		const cu = new ControlUnitModel(22);
		const cbb1 = new CBoosterModel(101);
		const cbb2 = new CBoosterModel(102);

		await dataModel.upsertUnit(cu);
		await dataModel.upsertUnit(cbb1);
		await dataModel.upsertUnit(cbb2);

		const cuChange = new ControlUnitModel(22);
		cuChange.data.keySwitchStatus = 1;

		let changeObj = await dataModel.upsertUnit(cuChange);

		expect(dataModel.controlUnit.units.unitsCount).to.eql(2);
		expect(dataModel.units["101"].data.serial).to.eql(101);
		expect(dataModel.units["102"].data.serial).to.eql(102);
	});

	it("can create a new  dataModel and add a CCB and 2 CBBS and change value on CBB", async function() {
		const dataModel = new DataModel();
		const cu = new ControlUnitModel(22, null);
		const cbb1 = new CBoosterModel(101, 22);
		const cbb2 = new CBoosterModel(102, 22);
		cbb1.data.created = 1010101;

		await dataModel.upsertUnit(cu);
		await dataModel.upsertUnit(cbb1);
		await dataModel.upsertUnit(cbb2);

		expect(dataModel.controlUnit.units.unitsCount).to.eql(2);
		expect(dataModel.units["101"].data.serial).to.eql(101);
		expect(dataModel.units["101"].data.created).to.eql(1010101);
		expect(dataModel.units["101"].data.modified).to.eql(null);
		expect(dataModel.units["102"].data.serial).to.eql(102);

		const ccb1Change = new CBoosterModel(101, null);
		ccb1Change.data.created = 2010101;

		ccb1Change.data.keySwitchStatus = 1;
		let changeObj = await dataModel.upsertUnit(ccb1Change);

		expect(dataModel.units["101"].data.keySwitchStatus).to.eql(1);
		expect(dataModel.units["101"].data.created).to.eql(1010101);
		expect(dataModel.units["101"].data.modified).to.eql(2010101);
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
		const cu = new ControlUnitModel(22);
		const cbb1 = new CBoosterModel(101);
		const cbb2 = new CBoosterModel(102);
		const edd1 = new EDDModel(null, 101, 1, 3000);
		edd1.data.logged = 1;

		const edd2 = new EDDModel(null, 101, 2, 3000);

		await dataModel.upsertUnit(cu);
		await dataModel.upsertUnit(cbb1);
		await dataModel.upsertUnit(cbb2);
		await dataModel.upsertUnit(edd1);
		await dataModel.upsertUnit(edd2);

		expect(dataModel.controlUnit.units.unitsCount).to.eql(2);
		expect(dataModel.units["101"].data.serial).to.eql(101);
		expect(dataModel.units["102"].data.serial).to.eql(102);
		expect(dataModel.units["101"].units.unitsCount).to.eql(2);
		expect(dataModel.units["101"].units.programCount).to.eql(0);
		expect(dataModel.units["101"].units.loggedCount).to.eql(1);

		const edd1Change = new EDDModel(null, 101, 1, 2000);
		edd1Change.data.detonatorStatus = 1;
		edd1Change.data.serial = 2342342;
		await dataModel.upsertUnit(edd1Change);

		const edd2Change = new EDDModel(null, 101, 2, 5000);
		edd2Change.data.detonatorStatus = 1;
		edd2Change.data.logged = 1;
		edd2Change.data.serial = 3424234;
		await dataModel.upsertUnit(edd2Change);

		console.log("CHANGE", JSON.stringify(dataModel, null, 2));
		expect(dataModel.units["101"].units.loggedCount).to.eql(2);
		expect(dataModel.units["101"].units.programCount).to.eql(0);
		expect(dataModel.units["101"].units.detonatorStatusCount).to.eql(2);
	});

	it("can aggregate the cbb states into the control unit", async function() {
		const dataModel = new DataModel();

		await dataModel.upsertUnit(new ControlUnitModel(22));
		await dataModel.upsertUnit(new CBoosterModel(101));
		await dataModel.upsertUnit(new CBoosterModel(102));

		//console.log("CHANGE", JSON.stringify(dataModel));
		expect(dataModel.controlUnit.units.unitsCount).to.eql(2);
		expect(dataModel.controlUnit.units.keySwitchStatusCount).to.eql(0);
		expect(dataModel.controlUnit.units.communicationStatusCount).to.eql(2);

		let cbbUpdate = new CBoosterModel(101);
		cbbUpdate.data.keySwitchStatus = 1;
		await dataModel.upsertUnit(cbbUpdate);

		expect(dataModel.controlUnit.units.unitsCount).to.eql(2);
		expect(dataModel.controlUnit.units.keySwitchStatusCount).to.eql(1);
		expect(dataModel.controlUnit.units.communicationStatusCount).to.eql(2);

		cbbUpdate = new CBoosterModel(102);
		cbbUpdate.data.keySwitchStatus = 1;
		await dataModel.upsertUnit(cbbUpdate);

		expect(dataModel.controlUnit.units.unitsCount).to.eql(2);
		expect(dataModel.controlUnit.units.keySwitchStatusCount).to.eql(2);
		expect(dataModel.controlUnit.units.communicationStatusCount).to.eql(2);

		cbbUpdate = new CBoosterModel(102);
		cbbUpdate.data.keySwitchStatus = 0;
		await dataModel.upsertUnit(cbbUpdate);

		expect(dataModel.controlUnit.units.unitsCount).to.eql(2);
		expect(dataModel.controlUnit.units.keySwitchStatusCount).to.eql(1);
		expect(dataModel.controlUnit.units.communicationStatusCount).to.eql(2);

		cbbUpdate = new CBoosterModel(102);
		cbbUpdate.data.communicationStatus = 0;
		await dataModel.upsertUnit(cbbUpdate);

		expect(dataModel.controlUnit.units.unitsCount).to.eql(2);
		expect(dataModel.controlUnit.units.keySwitchStatusCount).to.eql(1);
		expect(dataModel.controlUnit.units.communicationStatusCount).to.eql(1);
	});

	it("can aggregate the edd states into the CBB unit", async function() {
		const dataModel = new DataModel();

		await dataModel.upsertUnit(new ControlUnitModel(22));
		await dataModel.upsertUnit(new CBoosterModel(101));
		await dataModel.upsertUnit(new EDDModel(null, 101, 1, 1000));
		await dataModel.upsertUnit(new EDDModel(null, 101, 2, 2000));
		await dataModel.upsertUnit(new EDDModel(null, 101, 3, 3000));
		await dataModel.upsertUnit(new EDDModel(null, 101, 4, 4000));

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

	it("can correctly handle program counts", async function() {
		const dataModel = new DataModel();

		await dataModel.upsertUnit(new ControlUnitModel(22));
		await dataModel.upsertUnit(new CBoosterModel(101));
		await dataModel.upsertUnit(new EDDModel(null, 101, 1, null));
		await dataModel.upsertUnit(new EDDModel(null, 101, 2, null));
		await dataModel.upsertUnit(new EDDModel(null, 101, 3, null));
		await dataModel.upsertUnit(new EDDModel(null, 101, 4, null));

		//console.log("CHANGE", JSON.stringify(dataModel));
		expect(dataModel.controlUnit.units.unitsCount).to.eql(1);
		expect(dataModel.controlUnit.units.keySwitchStatusCount).to.eql(0);
		expect(dataModel.units["101"].units.unitsCount).to.eql(4);

		let eddUpdate1 = new EDDModel(null, 101, 1);
		eddUpdate1.data.program = 0;
		eddUpdate1.data.logged = 1;

		let eddUpdate2 = new EDDModel(null, 101, 2);
		eddUpdate2.data.program = 1;
		eddUpdate2.data.logged = 1;

		await dataModel.upsertUnit(eddUpdate1);
		await dataModel.upsertUnit(eddUpdate2);

		await timer(200);

		expect(dataModel.units["101"].units.unitsCount).to.eql(4);
		expect(dataModel.units["101"].units.detonatorStatusCount).to.eql(0);
		expect(dataModel.units["101"].units.loggedCount).to.eql(2);
		expect(dataModel.units["101"].units.programCount).to.eql(1);

		eddUpdate1 = new EDDModel(null, 101, 1);
		eddUpdate1.data.program = 1;
		eddUpdate1.data.logged = 1;

		eddUpdate2 = new EDDModel(null, 101, 2);
		eddUpdate2.data.program = 0;
		eddUpdate2.data.logged = 1;

		await dataModel.upsertUnit(eddUpdate1);
		await dataModel.upsertUnit(eddUpdate2);

		await timer(200);

		expect(dataModel.units["101"].units.unitsCount).to.eql(4);
		expect(dataModel.units["101"].units.detonatorStatusCount).to.eql(0);
		expect(dataModel.units["101"].units.loggedCount).to.eql(2);
		expect(dataModel.units["101"].units.programCount).to.eql(1);
	});

	it("can correctly handle program counts larger scale", async function() {
		const dataModel = new DataModel();

		await dataModel.upsertUnit(new ControlUnitModel(22));
		await dataModel.upsertUnit(new CBoosterModel(101));

		for (let i = 1; i < 101; i++) {
			await dataModel.upsertUnit(new EDDModel(null, 101, i, null));
		}

		expect(dataModel.controlUnit.units.unitsCount).to.eql(1);
		expect(dataModel.controlUnit.units.keySwitchStatusCount).to.eql(0);
		expect(dataModel.units["101"].units.unitsCount).to.eql(100);

		for (let i = 1; i <= 100; i++) {
			let eddUpdate1 = new EDDModel(null, 101, i);
			eddUpdate1.data.program = 1;
			eddUpdate1.data.logged = 1;
			await dataModel.upsertUnit(eddUpdate1);
		}

		await timer(200);

		expect(dataModel.units["101"].units.unitsCount).to.eql(100);
		expect(dataModel.units["101"].units.detonatorStatusCount).to.eql(0);
		expect(dataModel.units["101"].units.loggedCount).to.eql(100);
		expect(dataModel.units["101"].units.programCount).to.eql(100);

		for (let i = 1; i <= 100; i++) {
			let eddUpdate1 = new EDDModel(null, 101, i);
			//eddUpdate1.data.program = 1;
			eddUpdate1.data.program = i >= 1 && i <= 90 ? 1 : 0;
			eddUpdate1.data.logged = 1;
			await dataModel.upsertUnit(eddUpdate1);
		}

		expect(dataModel.units["101"].units.unitsCount).to.eql(100);
		expect(dataModel.units["101"].units.detonatorStatusCount).to.eql(0);
		expect(dataModel.units["101"].units.loggedCount).to.eql(100);
		expect(dataModel.units["101"].units.programCount).to.eql(90);

		for (let i = 1; i <= 100; i++) {
			let eddUpdate1 = new EDDModel(null, 101, i);
			eddUpdate1.data.program = i >= 11 && i <= 100 ? 1 : 0;
			eddUpdate1.data.logged = 1;
			await dataModel.upsertUnit(eddUpdate1);
		}

		expect(dataModel.units["101"].units.unitsCount).to.eql(100);
		expect(dataModel.units["101"].units.detonatorStatusCount).to.eql(0);
		expect(dataModel.units["101"].units.loggedCount).to.eql(100);
		expect(dataModel.units["101"].units.programCount).to.eql(90);

		let numbers = [1, 20, 15, 19, 36, 67, 87];
		for (let i = 1; i <= 100; i++) {
			let eddUpdate1 = new EDDModel(null, 101, i);
			if (numbers.includes(i)) {
				eddUpdate1.data.program = 0;
			} else {
				eddUpdate1.data.program = 1;
			}
			eddUpdate1.data.logged = 1;
			await dataModel.upsertUnit(eddUpdate1);
		}

		expect(dataModel.units["101"].units.unitsCount).to.eql(100);
		expect(dataModel.units["101"].units.detonatorStatusCount).to.eql(0);
		expect(dataModel.units["101"].units.loggedCount).to.eql(100);
		expect(dataModel.units["101"].units.programCount).to.eql(93);

		numbers = [12, 24, 78, 97, 34, 67, 87];
		for (let i = 1; i <= 100; i++) {
			let eddUpdate1 = new EDDModel(null, 101, i);
			if (numbers.includes(i)) {
				eddUpdate1.data.program = 0;
			} else {
				eddUpdate1.data.program = 1;
			}
			eddUpdate1.data.logged = 1;
			await dataModel.upsertUnit(eddUpdate1);
		}

		expect(dataModel.units["101"].units.unitsCount).to.eql(100);
		expect(dataModel.units["101"].units.detonatorStatusCount).to.eql(0);
		expect(dataModel.units["101"].units.loggedCount).to.eql(100);
		expect(dataModel.units["101"].units.programCount).to.eql(93);
	});
});
