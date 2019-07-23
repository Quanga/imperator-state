const { Crypt, checkUser } = require("../../../lib/constants/defaultAppConstants");

describe("SERCURITY", async function() {
	this.timeout(10000);
	it("can test the bcrypt function", async function() {
		let hash = await Crypt("guest");
		console.log(hash);
		let checked = await checkUser(hash, "teadminste");
		console.log(checked);
		//console.log(hash.substring(0, 72));
	});
});
