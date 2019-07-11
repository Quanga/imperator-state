/* eslint-disable no-unused-vars */
const Happner = require("happner-2");
//const Config = require("../../config.js");
const ServerHelper = require("../helpers/server_helper");

describe("E2E - CONNECTION EVENTS", function() {
	//let config = new Config().config;

	const timer = duration =>
		new Promise((resolve, reject) => {
			setTimeout(() => {
				resolve();
			}, duration);
		});

	this.timeout(40000);
	it("can connect to an endpoint", async function() {
		try {
			const testEndpoint = {
				name: "edge_ssot",
				happn: {
					host: "localhost",
					port: 55004,
					setOptions: {
						timeout: 40000
					},
					persist: true,
					secure: true,
					adminPassword: "happn",
					services: {
						data: {
							config: {
								filename: `${__dirname}/test.db`
							}
						}
					}
				},
				modules: {
					queueService: {
						instance: {
							getActiveQueues: function() {
								return new Promise((resolve, reject) => {
									resolve([]);
								});
							},
							buildQueue: function() {
								return new Promise((resolve, reject) => {
									resolve();
								});
							},
							size: function() {
								return new Promise((resolve, reject) => {
									resolve(0);
								});
							}
						}
					}
				},
				components: {
					queueService: {}
				}
			};

			//let mesh = await Happner.create(testEndpoint);
			var mesh = new Happner();
			await new Promise((resolve, reject) => {
				mesh.initialize(testEndpoint, function(err) {
					if (err) process.exit(1);

					/* MeshNode is ready but not listening */

					/* Maybe do some things to mesh before "start" */

					mesh.start(function(err) {
						if (err) process.exit(2);
						resolve();
						/* Components have run their start methods and server is listening */
					});
				});
			});

			var testUpsertUser = {
				username: "MESH_UNIT",
				password: "1234",
				groups: {
					_ADMIN: true
				}
			};

			await new Promise((resolve, reject) => {
				mesh.exchange.security.upsertUser(testUpsertUser, (e, result) => {
					if (e) return reject(e);
					resolve(result);
				});
			});

			await timer(3000);
			let serverHelper = new ServerHelper();
			await serverHelper.startServer();

			await timer(5000);
			mesh.stop(
				{
					kill: false, // kill the process once stopped
					wait: 1000, // wait for callbacks before kill
					exitCode: 1, // when kill, exit with this integer
					reconnect: true // inform attached clients/endpoints to reconnect
				},
				data => {
					console.log("TEST SERVER STOPPED");
				}
			);

			await timer(2000);

			await new Promise((resolve, reject) => {
				mesh.initialize(testEndpoint, function(err) {
					if (err) process.exit(1);

					/* MeshNode is ready but not listening */

					/* Maybe do some things to mesh before "start" */

					mesh.start(function(err) {
						if (err) process.exit(2);
						resolve();
						/* Components have run their start methods and server is listening */
					});
				});
			});
			await timer(10000);

			await serverHelper.stopServer();
			await timer(3000);
		} catch (err) {
			console.log(err);
		}
	});
});
