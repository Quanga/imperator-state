/* eslint-disable no-unused-vars */
var chai = require("chai");
var expect = chai.expect;
var chaiAsPromised = require("chai-as-promised");
chai.use(require("chai-match"));

chai.use(chaiAsPromised);
var Mesh = require("happner-2");

const ServerHelper = require("../../helpers/server_helper");

describe("INTEGRATION - Service", async function() {
	this.timeout(10000);

	let serverHelper = new ServerHelper();
	// // const serialPortHelper = new SerialPortHelper();

	let timer = ms => {
		return new Promise(resolve => setTimeout(resolve, ms));
	};

	let client = null;

	const AsyncLogin = () =>
		new Promise((resolve, reject) => {
			client = new Mesh.MeshClient({
				secure: true,
				port: 55000,
			});

			client.on("login/allow", () => resolve());
			client.on("login/deny", () => reject());
			client.on("login/error", () => reject());
			client.login({
				username: "_ADMIN",
				password: "happn",
			});
		});

	context("UI Service", async () => {
		before(async () => {
			try {
				await serverHelper.startServer();
				await AsyncLogin();
			} catch (err) {
				return Promise.reject(err);
			}
		});

		beforeEach("delete all current nodes", async function() {
			await client.exchange.uiService.delete("*");
		});

		after("stop test server", async function() {
			client.disconnect();
			await serverHelper.stopServer();
		});

		it("can get an empty ui object from the system", async () => {
			const { uiService } = client.exchange;
			let get = await uiService.getAxxisDash();
			delete get._meta;
			expect(get).to.deep.equal({ units: {} });
		});

		it("can add units to the ui object", async () => {
			const { uiService, data } = client.exchange;
			let set = await uiService.setAxxisDash({ id: 23, x: 345, y: 322 });
			let set2 = await uiService.setAxxisDash({ id: 24, x: 345, y: 322 });
			const { units, _meta } = set2;
			expect(units).to.deep.equal({ "23": { x: 345, y: 322 }, "24": { x: 345, y: 322 } });
		});

		it("can remove an item from the ui object", async () => {
			const { uiService, data } = client.exchange;
			let set = await uiService.setAxxisDash({ id: 23, x: 345, y: 322 });
			let set2 = await uiService.setAxxisDash({ id: 24, x: 345, y: 322 });

			let set3 = await uiService.deleteAxxisDash({ id: 23 });

			const { units, _meta } = set3;
			expect(units).to.deep.equal({ "24": { x: 345, y: 322 } });
		});
	});
});
