/* eslint-disable no-unused-vars */
const sinon = require("sinon");
const chai = require("chai");
const expect = chai.expect;
chai.use(require("chai-match"));
const sinonChai = require("sinon-chai");
chai.use(sinonChai);

const Happner = require("happner-2");
const ServerHelper = require("../../helpers/server_helper");
const sandbox = sinon.createSandbox();

const util = require("../../helpers/utils");

const adminClientConfig = {
	username: "ADMIN",
	password: "admin",
	allowSelfSignedCerts: true,
	info: {},
};

describe("INTEGRATION", async function() {
	this.timeout(20000);

	context("App Startup", async () => {
		const server = new ServerHelper();

		afterEach(async () => {
			await server.stopServer();
			sandbox.restore();
		});

		it("can startup the application with no database and login with Admin user", async function() {
			try {
				await util.removeDB("/edge/db/edge.db");

				server.emitter.on("data", data => {
					if (data.toString().match(/No configuration data found/)) {
						noConfigSpy();
					}
				});

				const noConfigSpy = sandbox.spy();
				const loginSpy = sandbox.spy();

				await server.startServer();

				const adminClient = new Happner.MeshClient({
					secure: true,
					port: 55000,
				});

				adminClient.on("login/allow", loginSpy);
				adminClient.login(adminClientConfig);

				await util.timer(2000);

				adminClient.disconnect({ revokeSession: true }, e => {
					if (!e) console.log("disconnection went fine, we have revoked the token " + adminClient.token);
				});

				expect(loginSpy.calledOnce).to.be.true;
				expect(noConfigSpy.calledOnce).to.be.true;
			} catch (err) {
				console.log(err);
			}
		});
	});
});
