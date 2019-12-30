/* eslint-disable no-unused-vars */
const chai = require("chai");
const expect = chai.expect;
chai.use(require("chai-match"));
const sinon = require("sinon");
const sinonChai = require("sinon-chai");
const chaiPromise = require("chai-as-promised");

chai.use(sinonChai);
chai.use(chaiPromise);

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
	context("Datamodel Methods", async () => {
		afterEach(() => {
			sandbox.restore();
		});

		it("can create a new empty dataModel", async () => {
			const dataModel = DataModel.create();

			const cu = UnitModelFactory(0).withSerial(22);
			const cbb1 = UnitModelFactory(3).withSerial(101);
			cbb1.data = { test1: "test1" };
			const cbb2 = UnitModelFactory(3).withSerial(102);
			cbb2.data = { test1: "test1" };

			let a;
			a = await dataModel.stageUpsert(cu);
			await dataModel.commitUpsert(a);
			a = await dataModel.stageUpsert(cbb1);
			await dataModel.commitUpsert(a);
			a = await dataModel.stageUpsert(cbb2);
			await dataModel.commitUpsert(a);

			const snapshot = dataModel.snapShot();
			console.log(JSON.stringify(snapshot, null, 2));
		});
	});
});
