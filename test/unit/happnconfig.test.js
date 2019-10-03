const chai = require("chai");
const expect = chai.expect;
chai.use(require("chai-match"));

describe("UNIT - happner", async function() {
	const Config = require("../../config");

	context("Happner Config file", async () => {
		const conf = new Config();

		it("can open the .mode.json file to extract system mode", async () => {
			expect(conf.getDotMode()).to.be.equal("HYDRA");
		});
	});
});
