/* eslint-disable no-unused-vars */
const fs = require("fs").promises;
const Happner = require("happner-2");
const ServerHelper = require("../../helpers/server_helper");
const sinon = require("sinon");
const expect = require("expect.js");
const os = require("os");

const adminClientConfig = {
	username: "ADMIN",
	password: "admin",
	allowSelfSignedCerts: true,
	info: {}
};

describe("INTEGRATION - APP STARTUP ", async function() {
	this.timeout(20000);
	const server = new ServerHelper();

	const timer = async duration =>
		new Promise((resolve, reject) => {
			setTimeout(() => {
				resolve();
			}, duration);
		});

	it("can startup the application with no database and login with Admin user", async function() {
		fs.unlink(`${os.homedir()}/edge/db/edge.db`, err => {
			if (err) return console.log(err);
		});

		server.emitter.on("data", data => {
			if (data.toString().match(/No configuration data found/)) {
				noConfigSpy();
			}
		});
		const noConfigSpy = sinon.spy();
		const spy = sinon.spy();
		await server.startServer();

		const adminClient = new Happner.MeshClient({
			secure: true,
			port: 55000
		});

		adminClient.on("login/allow", spy);
		adminClient.login(adminClientConfig);

		await timer(2000);

		adminClient.disconnect({ revokeSession: true }, e => {
			if (!e)
				console.log("disconnection went fine, we have revoked the token " + adminClient.token);
		});

		expect(spy.calledOnce).to.eql(true);
		expect(noConfigSpy.calledOnce).to.eql(true);

		await server.stopServer();
		await timer(2000);
	});

	it("can startup the application with reset argument", async function() {
		const spy = sinon.spy();
		server.emitter.on("data", data => {
			if (data.toString().match(/Reset flag on start/)) {
				spy();
			}
		});

		await server.startServer("reset-config");

		expect(spy.calledOnce).to.eql(true);

		await server.stopServer();
		await timer(2000);
	});

	it("can startup the application with reset-user argument", async function() {
		const spy = sinon.spy();
		server.emitter.on("data", data => {
			if (data.toString().match(/Server started with reset-user flag/)) {
				spy();
			}
		});

		await server.startServer("reset-users");

		expect(spy.calledOnce).to.eql(true);

		await server.stopServer();
		await timer(2000);
	});

	it("can startup the application with hard reset argument", async function() {
		const spy = sinon.spy();
		server.emitter.on("data", data => {
			if (data.toString().match(/Server started with hard-reset flag/)) {
				spy();
			}
		});

		await server.startServer("reset-hard");

		expect(spy.calledOnce).to.eql(true);

		await server.stopServer();
		await timer(2000);
	});

	it("can startup the application with no databased and login with all default users", async function() {
		fs.unlink(`${os.homedir()}/edge/db/edge.db`, err => {
			if (err) return console.log(err);
		});

		const { defaultUsers } = require("../../../lib/constants/defaultAppConstants");
		await server.startServer();

		const spy = sinon.spy();

		await timer(2000);

		const startUser = async user => {
			this[user] = new Happner.MeshClient({
				secure: true,
				port: 55000
			});

			this[user].on("login/allow", spy);

			this[user].login({
				username: user.username,
				password: user.password,
				allowSelfSignedCerts: true,
				info: {}
			});

			await timer(2000);

			this[user].disconnect({ revokeSession: true }, (e, token) => {
				if (!e) console.log("disconnection Revoked the token " + this[user].token);
			});
		};

		defaultUsers.forEach(user => {
			startUser(user);
		});

		await timer(5000);

		expect(spy.calledThrice).to.eql(true);

		await server.stopServer();
		await timer(2000);
	});
});
