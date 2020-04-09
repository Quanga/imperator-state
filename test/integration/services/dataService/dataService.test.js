const chai = require("chai");
const expect = chai.expect;
chai.use(require("chai-match"));

const path = require("path");
const testPath = __filename
	.split("/")
	.slice(0, -1)
	.join("/");

require("dotenv").config({ path: path.resolve(testPath, "./.env.test") });
process.env.PATH_OVERRIDE = testPath;
process.env.NODE_ENV = "test";

const DataMapper = require("../../../../lib/mappers/data_mapper");
const mapperUtils = require("../../../../lib/utils/common");

const config = require("../../../../happner.config");
const Mesh = require("happner-2");
const fs = require("fs");
const utils = require("../../../helpers/utils");

describe("INTEGRATION -- Services", async function() {
	this.timeout(10000);
	context("Data Service", async () => {
		let mesh;

		beforeEach(async () => {
			mesh = await Mesh.create(config);
		});

		this.afterEach("cleanup after test", async () => {
			await utils.removeDbFolder(path.resolve(testPath, "db/"));
		});

		it("can correctly rehydrate the data to a dataModel on startup", async () => {
			const units = await new Promise((resolve, reject) => {
				fs.readFile(path.resolve(testPath, "persistedData.json"), "utf8", (err, data) => {
					if (err) return reject(err);
					resolve(data.toString());
				});
			});
			const dataMapper = DataMapper.create();
			await utils.timer(2000);
			// create a list of objects
			const mappedUnits = dataMapper.mapToUnits(JSON.parse(units));
			mapperUtils.groupBy(mappedUnits, `meta.typeId`);
			await mesh.exchange.dataService.rehydrateData(mappedUnits);

			const snapshot = await mesh.exchange.dataService.getSnapShot();
			expect(snapshot[0]).to.exist;
			expect(snapshot[3]).to.exist;
			expect(snapshot[3]).to.exist;
			expect(snapshot[4]).to.exist;
			expect(snapshot[0][8].meta.createdAt).to.be.equal(1578026182700);
			expect(snapshot[3][13].meta.createdAt).to.be.equal(1578026182794);
			console.log(JSON.stringify(snapshot[3][13], null, 2));
			console.log(JSON.stringify(snapshot[0], null, 2));
		});
	});
});
