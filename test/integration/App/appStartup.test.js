/* eslint-disable no-unused-vars */
const fs = require("fs").promises;
const Happner = require("happner-2");
const ServerHelper = require("../../helpers/server_helper");
const sinon = require("sinon");
const expect = require("expect.js");

describe("INTEGRATION - APP STARTUP ", async function() {
	this.timeout(60000);
	const server = new ServerHelper();

	const timer = async duration =>
		new Promise((resolve, reject) => {
			setTimeout(() => {
				resolve();
			}, duration);
		});

	this.beforeEach("remove the db file", async function() {
		try {
			await server.startServer();
			await fs.unlink("/Users/timbewsey1/edge/db/edge.db");
			console.log("file removed");
		} catch (err) {
			console.log(err);
		}
	});

	this.afterEach("stop the server", async function() {
		await server.stopServer();
		await timer(2000);
	});

	it("can start up the app if endpoint is available", async function() {
		const spy = sinon.spy();

		var adminClient = new Happner.MeshClient({
			secure: true,
			port: 55000
		});

		var guestClient = new Happner.MeshClient({
			secure: true,
			port: 55000
		});

		adminClient.on("login/allow", spy);

		guestClient.on("login/allow", spy);

		adminClient.login({
			username: "AECE",
			password: "admin",
			allowSelfSignedCerts: true,
			info: {}
		});

		guestClient.login({
			username: "GUEST",
			password: "guest",
			allowSelfSignedCerts: true,
			info: {}
		});

		await timer(3000);

		adminClient.disconnect({ revokeSession: true }, (e, token) => {
			if (!e)
				console.log(
					"disconnection went fine, we have revoked the token " +
						adminClient.token
				);
		});

		guestClient.disconnect({ revokeSession: true }, e => {
			if (!e)
				console.log(
					"disconnection went fine, we have revoked the token " +
						guestClient.token
				);
		});
		expect(spy.calledTwice).to.eql(true);
	});
});
