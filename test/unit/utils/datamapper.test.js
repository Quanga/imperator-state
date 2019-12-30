const DataMapper = require("../../../lib/mappers/data_mapper");
const chai = require("chai");
const expect = chai.expect;
chai.use(require("chai-match"));
const chaiPromise = require("chai-as-promised");

const { PrimaryUnitModel, SecondaryUnitModel } = require("../../../lib/models/units/unitModels");

chai.use(chaiPromise);

describe("UNIT - Utils", async function() {
	this.timeout(2000);

	context("DataMapper", async () => {
		it("can remap a JSON unit to a class unit correctly", async function() {
			const datamapper = DataMapper.create();
			const testArr = [
				{
					meta: { serial: 23, typeId: 0 },
					data: { keySwitchStatus: 0 },
					state: { communicationState: 1 },
				},
				{
					meta: { serial: 23, typeId: 4 },
					data: { keySwitchStatus: 0 },
					state: { communicationState: 1 },
				},
			];
			let result = datamapper.mapToUnits(testArr);

			expect(result[0]).to.instanceOf(PrimaryUnitModel);
			expect(result[1]).to.instanceOf(SecondaryUnitModel);
		});
	});
});
