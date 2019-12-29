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
const modes = require("../../../lib/configs/modes/modes");
const fields = require("../../../lib/configs/fields/fieldConstants");

const {
	communicationStatus,
	serial,
	counts,
	childCount,
	keySwitchStatus,
	createdAt,
	modifiedAt,
	program,
	logged,
	tagged,
} = fields;

const sandbox = sinon.createSandbox();

const DataModel = require("../../../lib/models/dataModel");
const UnitModelFactory = require("../../../lib/models/units/unitModelFactory");

describe("UNIT - Models", async function() {
	context("Datamodel", async () => {
		afterEach(() => {
			sandbox.restore();
		});
		it("can create a new empty dataModel", async () => {
			const dataModel = DataModel.create();

			expect(dataModel.units).to.deep.equal({});
		});

		it("can create a new  dataModel and add a ccb to it", async () => {
			const dataModel = DataModel.create().withMode(modes.AXXIS100);
			const cu = UnitModelFactory(0).withSerial(22);

			let res;

			const upsert = dataModel.stageUpsert(cu).then(obj => {
				res = obj;
				return obj;
			});

			await expect(upsert)
				.to.eventually.have.property("action")
				.to.be.equal("INSERT");

			await dataModel.commitUpsert(res);

			expect(dataModel.units[0][22].meta[serial]).to.equal(22);
		});

		xit("will return an emit an error if the control unit does not match the current", async () => {
			const emitSpy = sandbox.spy();

			const dataModel = DataModel.create()
				.withMode(modes.AXXIS100)
				.on("error", err => emitSpy());

			const cu = UnitModelFactory(0).withSerial(22);
			const cuChange = UnitModelFactory(0).withSerial(32);

			await expect(dataModel.stageUpsert(cu))
				.to.eventually.have.property("action")
				.to.be.equal("INSERT");

			// const errMsg =
			// 	"Control Unit 35 does not match current serial 22. Please re-initialise the system";
			// await expect(dataModel.stageUpsert(cuChange))
			// 	.to.eventually.have.property("action")
			// 	.to.be.equal("ERROR");

			expect(emitSpy).to.have.been.calledOnce;
			expect(dataModel.units[0][22].meta[serial]).to.equal(32);
		});

		it("can create a new  dataModel and add a ccb and then 2 cbbs to it", async () => {
			const dataModel = DataModel.create()
				.withMode(modes.AXXIS100)
				.on("error", err => console.log(err));
			//const insertSpy = sandbox.spy(dataModel, "insertUnit");

			const cu = UnitModelFactory(0).withSerial(22);
			const cbb1 = UnitModelFactory(3).withSerial(101);
			const cbb2 = UnitModelFactory(3).withSerial(102);

			let a;
			a = await dataModel.stageUpsert(cu);
			await dataModel.commitUpsert(a);
			a = await dataModel.stageUpsert(cbb1);
			await dataModel.commitUpsert(a);

			//console.log(dataModel.units);
			//console.log(dataModel.units[0][22].children);
			expect(dataModel.units[0][22].children[3].length).to.be.equal(1);

			a = await dataModel.stageUpsert(cbb2);
			await dataModel.commitUpsert(a);

			expect(dataModel.units[0][22].meta[serial]).to.equal(22);
			expect(dataModel.units[3]).to.have.property("101");
			expect(dataModel.units[3]["101"].meta[serial]).to.equal(101);

			expect(dataModel.units[0][22].children[3].length).to.be.equal(2);
			//expect(dataModel.units[0][22][counts][3][communicationStatus]).to.be.equal(1);
			expect(dataModel.units[0][22][counts][3].data[keySwitchStatus]).to.be.equal(0);

			//expect(insertSpy).to.have.been.calledThrice;
		});

		it("can create a new  dataModel and add a ccb and 2 cbbs and change value on ccb", async () => {
			const dataModel = DataModel.create()
				.withMode(modes.AXXIS100)
				.on("err", err => {
					throw new Error(err);
				});

			const cu = UnitModelFactory(0).withSerial(22);
			const cbb1 = UnitModelFactory(3).withSerial(101);
			const cbb2 = UnitModelFactory(3).withSerial(102);

			let push;
			push = await dataModel.stageUpsert(cu);
			await dataModel.commitUpsert(push);

			push = await dataModel.stageUpsert(cbb1);
			await dataModel.commitUpsert(push);
			push = await dataModel.stageUpsert(cbb2);
			await dataModel.commitUpsert(push);

			const cuChange = UnitModelFactory(0).withSerial(22);
			cuChange.data.keySwitchStatus = 1;

			push = await dataModel.stageUpsert(cuChange);
			await dataModel.commitUpsert(push);

			expect(dataModel.units[0][22].children[3].length).to.be.equal(2);
			expect(dataModel.units[3]["101"].meta[serial]).to.be.equal(101);
			expect(dataModel.units[3]["102"].meta[serial]).to.be.equal(102);
		});

		it("can create a new  dataModel and add a CCB and 2 CBBS and change value on CBB", async () => {
			const dataModel = DataModel.create()
				.withMode(modes.AXXIS100)
				.on("err", err => {
					console.log(err);
					throw new Error(err);
				});

			const cu = UnitModelFactory(0).withSerial(22);
			const cbb1 = UnitModelFactory(3).withSerial(101);
			const cbb2 = UnitModelFactory(3).withSerial(102);

			cbb1.meta.createdAt = 1010101;

			let push;
			push = await dataModel.stageUpsert(cu);
			await dataModel.commitUpsert(push);

			push = await dataModel.stageUpsert(cbb1);
			await dataModel.commitUpsert(push);
			push = await dataModel.stageUpsert(cbb2);
			await dataModel.commitUpsert(push);

			expect(dataModel.units[0][22].children[3].length).to.be.equal(2);
			expect(dataModel.units[3]["101"].meta[serial]).to.be.equal(101);
			expect(dataModel.units[3]["101"].meta[createdAt]).to.be.equal(1010101);
			expect(dataModel.units[3]["101"].meta[modifiedAt]).to.be.undefined;
			expect(dataModel.units[3]["102"].meta[serial]).to.be.equal(102);

			const ccb1Change = UnitModelFactory(3).withSerial(101);

			ccb1Change.meta.createdAt = 2010101;
			ccb1Change.data.keySwitchStatus = 1;
			push = await dataModel.stageUpsert(ccb1Change);
			await dataModel.commitUpsert(push);
			console.log(dataModel.units[0][22][counts]);

			expect(dataModel.units[3]["101"].data[keySwitchStatus]).to.be.equal(1);
			expect(dataModel.units[3]["101"].meta[createdAt]).to.be.equal(1010101);
			expect(dataModel.units[3]["101"].meta[modifiedAt]).to.be.equal(2010101);
			expect(dataModel.units[0][22][counts][3].data[keySwitchStatus]).to.be.equal(1);

			const ccb1Change2 = UnitModelFactory(3).withSerial(101);
			ccb1Change2.data.keySwitchStatus = 0;

			push = await dataModel.stageUpsert(ccb1Change2);
			await dataModel.commitUpsert(push);

			expect(dataModel.units[3]["101"].data[keySwitchStatus]).to.be.equal(0);
			expect(dataModel.units[0][22][counts][3].data[keySwitchStatus]).to.be.equal(0);
		});

		it("can create a new  dataModel and add a CCB and 2 CBBS and add 2 EDDs", async () => {
			const dataModel = DataModel.create()
				.withMode(modes.AXXIS100)
				.on("err", err => {
					console.log(err);
					throw new Error(err);
				});

			const cu = UnitModelFactory(0).withSerial(22);
			const cbb1 = UnitModelFactory(3).withSerial(101);
			const cbb2 = UnitModelFactory(3).withSerial(102);

			const edd1 = UnitModelFactory(4)
				.withWindowId(1)
				.withParent(101);

			const edd2 = UnitModelFactory(4)
				.withWindowId(2)
				.withParent(101);

			let push;
			push = await dataModel.stageUpsert(cu);
			await dataModel.commitUpsert(push);

			push = await dataModel.stageUpsert(cbb1);
			await dataModel.commitUpsert(push);

			push = await dataModel.stageUpsert(cbb2);
			await dataModel.commitUpsert(push);

			push = await dataModel.stageUpsert(edd1);
			await dataModel.commitUpsert(push);

			push = await dataModel.stageUpsert(edd2);
			await dataModel.commitUpsert(push);

			expect(dataModel.units[0][22].children[3].length).to.be.equal(2);
			expect(dataModel.units[3]["101"].meta[serial]).to.be.equal(101);
			expect(dataModel.units[3]["102"].meta[serial]).to.be.equal(102);
			console.log(dataModel.units[3]["101"].children);
			expect(dataModel.units[3]["101"].children[4].length).to.be.equal(2);
			expect(dataModel.units[3]["101"][counts][4].data[program]).to.be.equal(0);
			expect(dataModel.units[3]["101"][counts][4].data[logged]).to.be.equal(0);

			const edd1Change = UnitModelFactory(4)
				.withWindowId(1)
				.withParent(101);

			edd1Change.state[communicationStatus] = 1;
			edd1Change.data[logged] = 1;
			//edd1Change.data.serial = 2342342;
			push = await dataModel.stageUpsert(edd1Change);
			await dataModel.commitUpsert(push);

			const edd2Change = UnitModelFactory(4)
				.withWindowId(2)
				.withParent(101);

			edd2Change.state[communicationStatus] = 1;
			edd2Change.data[logged] = 1;
			edd2Change.data[serial] = 3424234;

			push = await dataModel.stageUpsert(edd2Change);
			await dataModel.commitUpsert(push);

			expect(dataModel.units[3]["101"][counts][4].data[logged]).to.be.equal(2);
			expect(dataModel.units[3]["101"][counts][4].data[program]).to.be.equal(0);
			//expect(dataModel.units[3]["101"][counts][4][communicationStatus]).to.be.equal(2);
			const snap = await dataModel.snapShot();
			console.log(JSON.stringify(snap, null, 2));
		});

		it("can aggregate the cbb states into the control unit", async () => {
			const dataModel = DataModel.create()
				.withMode(modes.AXXIS100)
				.on("err", err => {
					console.log(err);
					throw new Error(err);
				});

			let push;
			push = await dataModel.stageUpsert(UnitModelFactory(0).withSerial(22));
			await dataModel.commitUpsert(push);

			push = await dataModel.stageUpsert(UnitModelFactory(3).withSerial(101));
			await dataModel.commitUpsert(push);

			push = await dataModel.stageUpsert(UnitModelFactory(3).withSerial(102));
			await dataModel.commitUpsert(push);
			console.log(dataModel.units[3]);
			expect(dataModel.units[0][22].children[3].length).to.be.equal(2);
			expect(dataModel.units[0][22][counts][3].data[keySwitchStatus]).to.be.equal(0);
			expect(dataModel.units[0][22][counts][3].state[communicationStatus]).to.be.equal(2);

			let cbbUpdate = UnitModelFactory(3).withSerial(101);
			cbbUpdate.data[keySwitchStatus] = 1;
			push = await dataModel.stageUpsert(cbbUpdate);
			await dataModel.commitUpsert(push);

			expect(dataModel.units[0][22].children[3].length).to.be.equal(2);
			expect(dataModel.units[0][22][counts][3].data[keySwitchStatus]).to.be.equal(1);
			expect(dataModel.units[0][22][counts][3].state[communicationStatus]).to.be.equal(2);

			cbbUpdate = UnitModelFactory(3).withSerial(102);
			cbbUpdate.data.keySwitchStatus = 1;
			push = await dataModel.stageUpsert(cbbUpdate);
			await dataModel.commitUpsert(push);

			expect(dataModel.units[0][22].children[3].length).to.be.equal(2);
			expect(dataModel.units[0][22][counts][3].data[keySwitchStatus]).to.be.equal(2);
			expect(dataModel.units[0][22][counts][3].state[communicationStatus]).to.be.equal(2);

			cbbUpdate = UnitModelFactory(3).withSerial(102);
			cbbUpdate.data.keySwitchStatus = 0;
			push = await dataModel.stageUpsert(cbbUpdate);
			await dataModel.commitUpsert(push);

			expect(dataModel.units[0][22].children[3].length).to.be.equal(2);
			expect(dataModel.units[0][22][counts][3].data[keySwitchStatus]).to.be.equal(1);
			expect(dataModel.units[0][22][counts][3].state[communicationStatus]).to.be.equal(2);

			cbbUpdate = UnitModelFactory(3).withSerial(102);
			cbbUpdate.state.communicationStatus = 0;

			push = await dataModel.stageUpsert(cbbUpdate);
			await dataModel.commitUpsert(push);

			expect(dataModel.units[0][22].children[3].length).to.be.equal(2);
			expect(dataModel.units[0][22][counts][3].data[keySwitchStatus]).to.be.equal(1);
			//expect(dataModel.units[0][22][counts][3].state[communicationStatus]).to.be.equal(1);
			const snap = await dataModel.snapShot();
			console.log(JSON.stringify(snap, null, 2));
		});

		it("can aggregate the edd states into the CBB unit", async () => {
			const dataModel = DataModel.create()
				.withMode(modes.AXXIS100)
				.on("err", err => {
					console.log(err);
					throw new Error(err);
				});
			let push;
			push = await dataModel.stageUpsert(UnitModelFactory(0).withSerial(22));
			await dataModel.commitUpsert(push);

			push = await dataModel.stageUpsert(UnitModelFactory(3).withSerial(101));
			await dataModel.commitUpsert(push);

			push = await dataModel.stageUpsert(UnitModelFactory(3).withSerial(102));
			await dataModel.commitUpsert(push);

			push = await dataModel.stageUpsert(UnitModelFactory(3).withSerial(103));
			await dataModel.commitUpsert(push);

			const ids = [1, 2, 3, 4];
			for (const id of ids) {
				push = await dataModel.stageUpsert(
					UnitModelFactory(4)
						.withWindowId(id)
						.withParent(101),
				);
				await dataModel.commitUpsert(push);
			}

			expect(dataModel.units[0][22].children[3].length).to.be.equal(3);
			expect(dataModel.units[0][22][counts][3].data[keySwitchStatus]).to.be.equal(0);
			expect(dataModel.units[3]["101"].children[4].length).to.be.equal(4);

			let eddUpdate = UnitModelFactory(4)
				.withWindowId(1)
				.withParent(101);

			eddUpdate.state[communicationStatus] = 1;
			eddUpdate.data[logged] = 1;
			push = await dataModel.stageUpsert(eddUpdate);
			await dataModel.commitUpsert(push);

			expect(dataModel.units[3]["101"].children[4].length).to.be.equal(4);
			//expect(dataModel.units[3]["101"][counts][4].state[communicationStatus]).to.be.equal(1);
			expect(dataModel.units[3]["101"][counts][4].data[logged]).to.be.equal(1);

			eddUpdate = UnitModelFactory(4)
				.withWindowId(1)
				.withParent(101);

			eddUpdate.state[communicationStatus] = 0;
			eddUpdate.data[logged] = 0;
			eddUpdate.data[tagged] = 1;
			push = await dataModel.stageUpsert(eddUpdate);
			await dataModel.commitUpsert(push);

			expect(dataModel.units[3]["101"].children[4].length).to.be.equal(4);
			expect(dataModel.units[3]["101"][counts][4].state[communicationStatus]).to.be.equal(1);
			expect(dataModel.units[3]["101"][counts][4].data[logged]).to.be.equal(0);
			expect(dataModel.units[3]["101"][counts][4].data[tagged]).to.be.equal(1);
		});

		it("can correctly handle program counts", async () => {
			const dataModel = DataModel.create()
				.withMode(modes.AXXIS100)
				.on("err", err => {
					console.log(err);
					throw new Error(err);
				});
			let push;
			push = await dataModel.stageUpsert(UnitModelFactory(0).withSerial(22));
			await dataModel.commitUpsert(push);

			push = await dataModel.stageUpsert(UnitModelFactory(3).withSerial(101));
			await dataModel.commitUpsert(push);

			const ids = [1, 2, 3, 4];
			for (const id of ids) {
				push = await dataModel.stageUpsert(
					UnitModelFactory(4)
						.withWindowId(id)
						.withParent(101),
				);
				await dataModel.commitUpsert(push);
			}

			expect(dataModel.units[0][22].children[3].length).to.be.equal(1);
			expect(dataModel.units[0][22][counts][3].data[keySwitchStatus]).to.be.equal(0);
			expect(dataModel.units[3]["101"].children[4].length).to.be.equal(4);

			let eddUpdate1 = UnitModelFactory(4)
				.withParent(101)
				.withWindowId(1);

			eddUpdate1.data[program] = 0;
			eddUpdate1.data[logged] = 1;

			let eddUpdate2 = UnitModelFactory(4)
				.withParent(101)
				.withWindowId(2);
			eddUpdate2.data[program] = 1;
			eddUpdate2.data[logged] = 1;

			push = await dataModel.stageUpsert(eddUpdate1);
			await dataModel.commitUpsert(push);

			push = await dataModel.stageUpsert(eddUpdate2);
			await dataModel.commitUpsert(push);

			await utils.timer(200);

			expect(dataModel.units[3]["101"].children[4].length).to.be.equal(4);
			expect(dataModel.units[3]["101"][counts][4].state[communicationStatus]).to.be.equal(0);
			expect(dataModel.units[3]["101"][counts][4].data[logged]).to.be.equal(2);
			expect(dataModel.units[3]["101"][counts][4].data[program]).to.be.equal(1);

			eddUpdate1 = UnitModelFactory(4)
				.withParent(101)
				.withWindowId(1);
			eddUpdate1.data[program] = 1;
			eddUpdate1.data[logged] = 1;

			eddUpdate2 = UnitModelFactory(4)
				.withParent(101)
				.withWindowId(1);
			eddUpdate2.data[program] = 1;
			eddUpdate2.data[logged] = 1;

			push = await dataModel.stageUpsert(eddUpdate1);
			await dataModel.commitUpsert(push);

			push = await dataModel.stageUpsert(eddUpdate2);
			await dataModel.commitUpsert(push);

			await utils.timer(200);

			expect(dataModel.units[3]["101"].children[4].length).to.be.equal(4);
			expect(dataModel.units[3]["101"][counts][4].state[communicationStatus]).to.be.equal(0);
			expect(dataModel.units[3]["101"][counts][4].data[logged]).to.be.equal(2);
			expect(dataModel.units[3]["101"][counts][4].data[program]).to.be.equal(2);
		});

		it("can correctly handle program counts larger scale", async () => {
			const dataModel = DataModel.create()
				.withMode(modes.AXXIS100)
				.on("err", err => {
					console.log(err);
					throw new Error(err);
				});
			let push;
			push = await dataModel.stageUpsert(UnitModelFactory(0).withSerial(22));
			await dataModel.commitUpsert(push);

			push = await dataModel.stageUpsert(UnitModelFactory(3).withSerial(101));
			await dataModel.commitUpsert(push);

			for (let i = 1; i < 101; i++) {
				push = await dataModel.stageUpsert(
					UnitModelFactory(4)
						.withParent(101)
						.withWindowId(i),
				);
				await dataModel.commitUpsert(push);
			}

			expect(dataModel.units[0][22].children[3].length).to.be.equal(1);
			expect(dataModel.units[0][22][counts][3].data[keySwitchStatus]).to.be.equal(0);
			expect(dataModel.units[3]["101"].children[4].length).to.be.equal(100);

			for (let i = 1; i <= 100; i++) {
				let eddUpdate1 = UnitModelFactory(4)
					.withParent(101)
					.withWindowId(i);

				eddUpdate1.data[program] = 1;
				eddUpdate1.data[logged] = 1;
				push = await dataModel.stageUpsert(eddUpdate1);
				await dataModel.commitUpsert(push);
			}

			await utils.timer(200);

			expect(dataModel.units[3]["101"].children[4].length).to.be.equal(100);
			//expect(dataModel.units[3]["101"][counts][4][communicationStatus]).to.be.equal(0);
			expect(dataModel.units[3]["101"][counts][4].data[logged]).to.be.equal(100);
			expect(dataModel.units[3]["101"][counts][4].data[program]).to.be.equal(100);

			for (let i = 1; i <= 100; i++) {
				let eddUpdate1 = UnitModelFactory(4)
					.withParent(101)
					.withWindowId(i);

				//eddUpdate1.data.program = 1;
				eddUpdate1.data[program] = i >= 1 && i <= 90 ? 1 : 0;
				eddUpdate1.data[logged] = 1;
				push = await dataModel.stageUpsert(eddUpdate1);
				await dataModel.commitUpsert(push);
			}

			expect(dataModel.units[3]["101"].children[4].length).to.be.equal(100);
			//expect(dataModel.units[3]["101"][counts][4][communicationStatus]).to.be.equal(0);
			expect(dataModel.units[3]["101"][counts][4].data[logged]).to.be.equal(100);
			expect(dataModel.units[3]["101"][counts][4].data[program]).to.be.equal(90);

			for (let i = 1; i <= 100; i++) {
				let eddUpdate1 = UnitModelFactory(4)
					.withParent(101)
					.withWindowId(i);

				eddUpdate1.data[program] = i >= 11 && i <= 100 ? 1 : 0;
				eddUpdate1.data[logged] = 1;
				push = await dataModel.stageUpsert(eddUpdate1);
				await dataModel.commitUpsert(push);
			}

			expect(dataModel.units[3]["101"].children[4].length).to.be.equal(100);
			//expect(dataModel.units[3]["101"][counts][4][communicationStatus]).to.be.equal(0);
			expect(dataModel.units[3]["101"][counts][4].data[logged]).to.be.equal(100);
			expect(dataModel.units[3]["101"][counts][4].data[program]).to.be.equal(90);

			let numbers = [1, 20, 15, 19, 36, 67, 87];
			for (let i = 1; i <= 100; i++) {
				let eddUpdate1 = UnitModelFactory(4)
					.withParent(101)
					.withWindowId(i);

				eddUpdate1.data[program] = numbers.includes(i) ? 0 : 1;

				eddUpdate1.data[logged] = 1;
				push = await dataModel.stageUpsert(eddUpdate1);
				await dataModel.commitUpsert(push);
			}

			expect(dataModel.units[3]["101"].children[4].length).to.be.equal(100);
			//expect(dataModel.units[3]["101"][counts][4][communicationStatus]).to.be.equal(0);
			expect(dataModel.units[3]["101"][counts][4].data[logged]).to.be.equal(100);
			expect(dataModel.units[3]["101"][counts][4].data[program]).to.be.equal(93);

			numbers = [12, 24, 78, 97, 34, 67, 87];
			for (let i = 1; i <= 100; i++) {
				let eddUpdate1 = UnitModelFactory(4)
					.withParent(101)
					.withWindowId(i);

				eddUpdate1.data[program] = numbers.includes(i) ? 0 : 1;

				eddUpdate1.data[logged] = 1;
				push = await dataModel.stageUpsert(eddUpdate1);
				await dataModel.commitUpsert(push);
			}

			expect(dataModel.units[3]["101"].children[4].length).to.be.equal(100);
			//expect(dataModel.units[3]["101"][counts][4][communicationStatus]).to.be.equal(0);
			expect(dataModel.units[3]["101"][counts][4].data[logged]).to.be.equal(100);
			expect(dataModel.units[3]["101"][counts][4].data[program]).to.be.equal(93);
		});
	});
});
