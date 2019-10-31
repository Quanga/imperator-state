/* eslint-disable no-unused-vars */
const chai = require("chai");
const expect = chai.expect;
chai.use(require("chai-match"));
const sinon = require("sinon");
const sinonChai = require("sinon-chai");
const chaiPromise = require("chai-as-promised");

chai.use(sinonChai);
chai.use(chaiPromise);
const utils = require("../../helpers/utils");

const sandbox = sinon.createSandbox();

const DataModel = require("../../../lib/models/dataModel");
const { ControlUnitModel, CBoosterModel, EDDModel } = require("../../../lib/models/unitModels");

describe("UNIT - Models", async function() {
	context("Datamodel", async () => {
		afterEach(() => {
			sandbox.restore();
		});
		it("can create a new empty dataModel", async function() {
			const DataMapper = require("../../../lib/mappers/data_mapper");

			const dataModel = new DataModel();

			expect(dataModel.controlUnit).to.be.null;
			expect(dataModel.units).to.be.deep.equal({});
			expect(dataModel.mapper).to.be.instanceOf(DataMapper);
		});

		it("can create a new  dataModel and add a ccb to it", async function() {
			const dataModel = new DataModel();
			const cu = new ControlUnitModel(22);
			const insertSpy = sandbox.spy(dataModel, "insertUnit");

			await expect(dataModel.upsertUnit(cu))
				.to.eventually.be.have.property("action")
				.to.be.equal("INSERT");

			expect(dataModel.controlUnit.data.serial).to.equal(22);
			expect(insertSpy).to.have.been.calledOnce;
			const insertCall = insertSpy.getCall(0).args[0];
			expect(insertCall).to.be.instanceOf(ControlUnitModel);
		});

		it("will return an Object with an error if the control unit does not match the current", async () => {
			const dataModel = new DataModel();

			await expect(dataModel.upsertUnit(new ControlUnitModel(22)))
				.to.eventually.have.property("action")
				.to.be.equal("INSERT");

			const errMsg =
				"Control Unit 35 does not match current serial 22. Please re-initialise the system";
			await expect(dataModel.upsertUnit(new ControlUnitModel(35)))
				.to.eventually.have.property("action")
				.to.be.equal("ERROR");

			expect(dataModel.controlUnit.data.serial).to.equal(22);
		});

		it("can create a new  dataModel and add a ccb and then 2 cbbs to it", async () => {
			const dataModel = new DataModel();
			const insertSpy = sandbox.spy(dataModel, "insertUnit");

			const cu = new ControlUnitModel(22);
			const cbb1 = new CBoosterModel(101);
			const cbb2 = new CBoosterModel(102);

			await dataModel.upsertUnit(cu);
			await dataModel.upsertUnit(cbb1);
			expect(dataModel.controlUnit.units.unitsCount).to.be.equal(1);

			await dataModel.upsertUnit(cbb2);

			expect(dataModel.controlUnit.data.serial).to.equal(22);
			expect(dataModel.units).to.have.property("101");
			expect(dataModel.units["101"].data.serial).to.equal(101);

			expect(dataModel.controlUnit.units.unitsCount).to.be.equal(2);
			expect(dataModel.controlUnit.units.communicationStatusCount).to.be.equal(2);
			expect(dataModel.controlUnit.units.keySwitchStatusCount).to.be.equal(0);

			expect(insertSpy).to.have.been.calledThrice;
		});

		it("can create a new  dataModel and add a ccb and 2 cbbs and change value on ccb", async () => {
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

			expect(dataModel.controlUnit.units.unitsCount).to.be.equal(2);
			expect(dataModel.units["101"].data.serial).to.be.equal(101);
			expect(dataModel.units["102"].data.serial).to.be.equal(102);
		});

		it("can create a new  dataModel and add a CCB and 2 CBBS and change value on CBB", async () => {
			const dataModel = new DataModel();
			const cu = new ControlUnitModel(22, null);
			const cbb1 = new CBoosterModel(101, 22);
			const cbb2 = new CBoosterModel(102, 22);
			cbb1.data.createdAt = 1010101;

			await dataModel.upsertUnit(cu);
			await dataModel.upsertUnit(cbb1);
			await dataModel.upsertUnit(cbb2);

			expect(dataModel.controlUnit.units.unitsCount).to.be.equal(2);
			expect(dataModel.units["101"].data.serial).to.be.equal(101);
			expect(dataModel.units["101"].data.createdAt).to.be.equal(1010101);
			expect(dataModel.units["101"].data.modifiedAt).to.be.equal(null);
			expect(dataModel.units["102"].data.serial).to.be.equal(102);

			const ccb1Change = new CBoosterModel(101, null);
			ccb1Change.data.createdAt = 2010101;

			ccb1Change.data.keySwitchStatus = 1;
			let changeObj = await dataModel.upsertUnit(ccb1Change);

			expect(dataModel.units["101"].data.keySwitchStatus).to.be.equal(1);
			expect(dataModel.units["101"].data.createdAt).to.be.equal(1010101);
			expect(dataModel.units["101"].data.modifiedAt).to.be.equal(2010101);
			expect(dataModel.controlUnit.units.keySwitchStatusCount).to.be.equal(1);

			const ccb1Change2 = new CBoosterModel(101, null);
			ccb1Change2.data.keySwitchStatus = 0;
			changeObj = await dataModel.upsertUnit(ccb1Change2);

			expect(dataModel.units["101"].data.keySwitchStatus).to.be.equal(0);
			expect(dataModel.controlUnit.units.keySwitchStatusCount).to.be.equal(0);

			//console.log("CHANGE", changeObj);
		});

		it("can create a new  dataModel and add a CCB and 2 CBBS and add 2 EDDs", async () => {
			const dataModel = new DataModel();
			const cu = new ControlUnitModel(22);
			const cbb1 = new CBoosterModel(101);
			const cbb2 = new CBoosterModel(102);
			const edd1 = new EDDModel('272.0.234.33', 101, 1, 3000);

			const edd2 = new EDDModel('272.0.234.33', 101, 2, 3000);

			await dataModel.upsertUnit(cu);
			await dataModel.upsertUnit(cbb1);
			await dataModel.upsertUnit(cbb2);
			await dataModel.upsertUnit(edd1);
			await dataModel.upsertUnit(edd2);

			expect(dataModel.controlUnit.units.unitsCount).to.be.equal(2);
			expect(dataModel.units["101"].data.serial).to.be.equal(101);
			expect(dataModel.units["102"].data.serial).to.be.equal(102);
			expect(dataModel.units["101"].units.unitsCount).to.be.equal(2);
			expect(dataModel.units["101"].units.programCount).to.be.equal(0);
			expect(dataModel.units["101"].units.loggedCount).to.be.equal(0);

			const edd1Change = new EDDModel('272.0.234.33', 101, 1, 2000);
			edd1Change.data.detonatorStatus = 1;
			edd1Change.data.logged = 1;
			edd1Change.data.serial = 2342342;
			await dataModel.upsertUnit(edd1Change);

			const edd2Change = new EDDModel('272.0.234.33', 101, 2, 5000);
			edd2Change.data.detonatorStatus = 1;
			edd2Change.data.logged = 1;
			edd2Change.data.serial = 3424234;
			await dataModel.upsertUnit(edd2Change);

			expect(dataModel.units["101"].units.loggedCount).to.be.equal(2);
			expect(dataModel.units["101"].units.programCount).to.be.equal(0);
			expect(dataModel.units["101"].units.detonatorStatusCount).to.be.equal(2);
		});

		it("can aggregate the cbb states into the control unit", async () => {
			const dataModel = new DataModel();

			await dataModel.upsertUnit(new ControlUnitModel(22));
			await dataModel.upsertUnit(new CBoosterModel(101));
			await dataModel.upsertUnit(new CBoosterModel(102));

			//console.log("CHANGE", JSON.stringify(dataModel));
			expect(dataModel.controlUnit.units.unitsCount).to.be.equal(2);
			expect(dataModel.controlUnit.units.keySwitchStatusCount).to.be.equal(0);
			expect(dataModel.controlUnit.units.communicationStatusCount).to.be.equal(2);

			let cbbUpdate = new CBoosterModel(101);
			cbbUpdate.data.keySwitchStatus = 1;
			await dataModel.upsertUnit(cbbUpdate);

			expect(dataModel.controlUnit.units.unitsCount).to.be.equal(2);
			expect(dataModel.controlUnit.units.keySwitchStatusCount).to.be.equal(1);
			expect(dataModel.controlUnit.units.communicationStatusCount).to.be.equal(2);

			cbbUpdate = new CBoosterModel(102);
			cbbUpdate.data.keySwitchStatus = 1;
			await dataModel.upsertUnit(cbbUpdate);

			expect(dataModel.controlUnit.units.unitsCount).to.be.equal(2);
			expect(dataModel.controlUnit.units.keySwitchStatusCount).to.be.equal(2);
			expect(dataModel.controlUnit.units.communicationStatusCount).to.be.equal(2);

			cbbUpdate = new CBoosterModel(102);
			cbbUpdate.data.keySwitchStatus = 0;
			await dataModel.upsertUnit(cbbUpdate);

			expect(dataModel.controlUnit.units.unitsCount).to.be.equal(2);
			expect(dataModel.controlUnit.units.keySwitchStatusCount).to.be.equal(1);
			expect(dataModel.controlUnit.units.communicationStatusCount).to.be.equal(2);

			cbbUpdate = new CBoosterModel(102);
			cbbUpdate.data.communicationStatus = 0;
			await dataModel.upsertUnit(cbbUpdate);

			expect(dataModel.controlUnit.units.unitsCount).to.be.equal(2);
			expect(dataModel.controlUnit.units.keySwitchStatusCount).to.be.equal(1);
			expect(dataModel.controlUnit.units.communicationStatusCount).to.be.equal(1);
		});

		it("can aggregate the edd states into the CBB unit", async () => {
			const dataModel = new DataModel();

			await dataModel.upsertUnit(new ControlUnitModel(22));
			await dataModel.upsertUnit(new CBoosterModel(101));
			await dataModel.upsertUnit(new EDDModel("272.0.234.22", 101, 1, 1000));
			await dataModel.upsertUnit(new EDDModel("272.0.234.23", 101, 2, 2000));
			await dataModel.upsertUnit(new EDDModel("272.0.234.24", 101, 3, 3000));
			await dataModel.upsertUnit(new EDDModel("272.0.234.25", 101, 4, 4000));

			//console.log("CHANGE", JSON.stringify(dataModel));
			expect(dataModel.controlUnit.units.unitsCount).to.be.equal(1);
			expect(dataModel.controlUnit.units.keySwitchStatusCount).to.be.equal(0);
			expect(dataModel.units["101"].units.unitsCount).to.be.equal(4);

			let eddUpdate = new EDDModel("272.0.234.22", 101, 1);
			eddUpdate.data.detonatorStatus = 1;
			eddUpdate.data.logged = 1;
			await dataModel.upsertUnit(eddUpdate);

			expect(dataModel.units["101"].units.unitsCount).to.be.equal(4);
			expect(dataModel.units["101"].units.detonatorStatusCount).to.be.equal(1);
			expect(dataModel.units["101"].units.loggedCount).to.be.equal(1);

			eddUpdate = new EDDModel("272.0.234.22", 101, 1);
			eddUpdate.data.detonatorStatus = 0;
			eddUpdate.data.logged = 0;
			eddUpdate.data.tagged = 1;
			await dataModel.upsertUnit(eddUpdate);

			expect(dataModel.units["101"].units.unitsCount).to.be.equal(4);
			expect(dataModel.units["101"].units.detonatorStatusCount).to.be.equal(0);
			expect(dataModel.units["101"].units.loggedCount).to.be.equal(0);
			expect(dataModel.units["101"].units.taggedCount).to.be.equal(1);
		});

		it("can correctly handle program counts", async () => {
			const dataModel = new DataModel();

			await dataModel.upsertUnit(new ControlUnitModel(22));
			await dataModel.upsertUnit(new CBoosterModel(101));
			await dataModel.upsertUnit(new EDDModel("272.0.234.22", 101, 1, null));
			await dataModel.upsertUnit(new EDDModel("272.0.234.23", 101, 2, null));
			await dataModel.upsertUnit(new EDDModel("272.0.234.24", 101, 3, null));
			await dataModel.upsertUnit(new EDDModel("272.0.234.25", 101, 4, null));

			expect(dataModel.controlUnit.units.unitsCount).to.be.equal(1);
			expect(dataModel.controlUnit.units.keySwitchStatusCount).to.be.equal(0);
			expect(dataModel.units["101"].units.unitsCount).to.be.equal(4);

			let eddUpdate1 = new EDDModel("272.0.234.22", 101, 1);
			eddUpdate1.data.program = 0;
			eddUpdate1.data.logged = 1;

			let eddUpdate2 = new EDDModel("272.0.234.22", 101, 2);
			eddUpdate2.data.program = 1;
			eddUpdate2.data.logged = 1;

			await dataModel.upsertUnit(eddUpdate1);
			await dataModel.upsertUnit(eddUpdate2);

			await utils.timer(200);

			expect(dataModel.units["101"].units.unitsCount).to.be.equal(4);
			expect(dataModel.units["101"].units.detonatorStatusCount).to.be.equal(0);
			expect(dataModel.units["101"].units.loggedCount).to.be.equal(2);
			expect(dataModel.units["101"].units.programCount).to.be.equal(1);

			eddUpdate1 = new EDDModel("272.0.234.22", 101, 1);
			eddUpdate1.data.program = 1;
			eddUpdate1.data.logged = 1;

			eddUpdate2 = new EDDModel("272.0.234.22", 101, 2);
			eddUpdate2.data.program = 1;
			eddUpdate2.data.logged = 1;

			await dataModel.upsertUnit(eddUpdate1);
			await dataModel.upsertUnit(eddUpdate2);

			await utils.timer(200);

			expect(dataModel.units["101"].units.unitsCount).to.be.equal(4);
			expect(dataModel.units["101"].units.detonatorStatusCount).to.be.equal(0);
			expect(dataModel.units["101"].units.loggedCount).to.be.equal(2);
			expect(dataModel.units["101"].units.programCount).to.be.equal(2);
		});

		it("can correctly handle program counts larger scale", async () => {
			const dataModel = new DataModel();

			await dataModel.upsertUnit(new ControlUnitModel(22));
			await dataModel.upsertUnit(new CBoosterModel(101));

			for (let i = 1; i < 101; i++) {
				await dataModel.upsertUnit(new EDDModel(`272.0.234.${i}`, 101, i, null));
			}

			expect(dataModel.controlUnit.units.unitsCount).to.be.equal(1);
			expect(dataModel.controlUnit.units.keySwitchStatusCount).to.be.equal(0);
			expect(dataModel.units["101"].units.unitsCount).to.be.equal(100);

			for (let i = 1; i <= 100; i++) {
				let eddUpdate1 = new EDDModel(`272.0.234.${i}`, 101, i);
				eddUpdate1.data.program = 1;
				eddUpdate1.data.logged = 1;
				await dataModel.upsertUnit(eddUpdate1);
			}

			await utils.timer(200);

			expect(dataModel.units["101"].units.unitsCount).to.be.equal(100);
			expect(dataModel.units["101"].units.detonatorStatusCount).to.be.equal(0);
			expect(dataModel.units["101"].units.loggedCount).to.be.equal(100);
			expect(dataModel.units["101"].units.programCount).to.be.equal(100);

			for (let i = 1; i <= 100; i++) {
				let eddUpdate1 = new EDDModel(`272.0.234.${i}`, 101, i);
				//eddUpdate1.data.program = 1;
				eddUpdate1.data.program = i >= 1 && i <= 90 ? 1 : 0;
				eddUpdate1.data.logged = 1;
				await dataModel.upsertUnit(eddUpdate1);
			}

			expect(dataModel.units["101"].units.unitsCount).to.be.equal(100);
			expect(dataModel.units["101"].units.detonatorStatusCount).to.be.equal(0);
			expect(dataModel.units["101"].units.loggedCount).to.be.equal(100);
			expect(dataModel.units["101"].units.programCount).to.be.equal(90);

			for (let i = 1; i <= 100; i++) {
				let eddUpdate1 = new EDDModel(`272.0.234.${i}`, 101, i);
				eddUpdate1.data.program = i >= 11 && i <= 100 ? 1 : 0;
				eddUpdate1.data.logged = 1;
				await dataModel.upsertUnit(eddUpdate1);
			}

			expect(dataModel.units["101"].units.unitsCount).to.be.equal(100);
			expect(dataModel.units["101"].units.detonatorStatusCount).to.be.equal(0);
			expect(dataModel.units["101"].units.loggedCount).to.be.equal(100);
			expect(dataModel.units["101"].units.programCount).to.be.equal(90);

			let numbers = [1, 20, 15, 19, 36, 67, 87];
			for (let i = 1; i <= 100; i++) {
				let eddUpdate1 = new EDDModel(`272.0.234.${i}`, 101, i);
				if (numbers.includes(i)) {
					eddUpdate1.data.program = 0;
				} else {
					eddUpdate1.data.program = 1;
				}
				eddUpdate1.data.logged = 1;
				await dataModel.upsertUnit(eddUpdate1);
			}

			expect(dataModel.units["101"].units.unitsCount).to.be.equal(100);
			expect(dataModel.units["101"].units.detonatorStatusCount).to.be.equal(0);
			expect(dataModel.units["101"].units.loggedCount).to.be.equal(100);
			expect(dataModel.units["101"].units.programCount).to.be.equal(93);

			numbers = [12, 24, 78, 97, 34, 67, 87];
			for (let i = 1; i <= 100; i++) {
				let eddUpdate1 = new EDDModel(`272.0.234.${i}`, 101, i);
				if (numbers.includes(i)) {
					eddUpdate1.data.program = 0;
				} else {
					eddUpdate1.data.program = 1;
				}
				eddUpdate1.data.logged = 1;
				await dataModel.upsertUnit(eddUpdate1);
			}

			expect(dataModel.units["101"].units.unitsCount).to.be.equal(100);
			expect(dataModel.units["101"].units.detonatorStatusCount).to.be.equal(0);
			expect(dataModel.units["101"].units.loggedCount).to.be.equal(100);
			expect(dataModel.units["101"].units.programCount).to.be.equal(93);
		});
	});
});
