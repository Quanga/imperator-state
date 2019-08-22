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
const { defaultUsers } = require("../../../lib/constants/defaultAppConstants");

const adminClientConfig = {
	username: "ADMIN",
	password: "admin",
	allowSelfSignedCerts: true,
	info: {}
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
					port: 55000
				});

				adminClient.on("login/allow", loginSpy);
				adminClient.login(adminClientConfig);

				await util.timer(2000);

				adminClient.disconnect({ revokeSession: true }, e => {
					if (!e)
						console.log("disconnection went fine, we have revoked the token " + adminClient.token);
				});

				expect(loginSpy.calledOnce).to.be.true;
				expect(noConfigSpy.calledOnce).to.be.true;
			} catch (err) {
				console.log(err);
			}
		});

		it("can startup the application with reset argument", async function() {
			const emitterSpy = sandbox.spy();
			server.emitter.on("data", data => {
				if (data.toString().match(/Reset flag on start/)) {
					emitterSpy();
				}
			});

			await server.startServer("reset-config");
			expect(emitterSpy.calledOnce).to.be.true;
		});

		xit("can startup the application with reset-user argument", async function() {
			const emitterSpy = sinon.spy();
			server.emitter.on("data", data => {
				if (data.toString().match(/Server started with reset-user flag/)) {
					emitterSpy();
				}
			});

			await server.startServer("reset-users");
			expect(emitterSpy.calledOnce).to.be.true;
		});

		xit("can startup the application with hard reset argument", async function() {
			const emitterSpy = sinon.spy();
			server.emitter.on("data", data => {
				if (data.toString().match(/Server started with hard-reset flag/)) {
					emitterSpy();
				}
			});

			await server.startServer("reset-hard");
			expect(emitterSpy.calledOnce).to.be.true;
		});

		xit("can startup the application with no databased and login with all default users", async () => {
			await util.removeDB("/edge/db/edge.db");

			console.log("starting server");
			await server.startServer();

			const loginSpy = sinon.spy();

			await util.timer(2000);

			const startUser = async user => {
				this[user] = new Happner.MeshClient({
					secure: true,
					port: 55000
				});

				this[user].on("login/allow", loginSpy);

				this[user].login({
					username: user.username,
					password: user.password,
					allowSelfSignedCerts: true,
					info: {}
				});

				await util.timer(2000);

				this[user].disconnect({ revokeSession: true }, (e, token) => {
					if (!e) console.log("disconnection Revoked the token " + this[user].token);
				});
			};

			defaultUsers.forEach(user => {
				startUser(user);
			});

			await util.timer(5000);
			expect(loginSpy).to.have.been.calledThrice;
		});
	});
});
