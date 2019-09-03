// eslint-disable-next-line no-unused-vars
const chai = require("chai");
const expect = chai.expect;
chai.use(require("chai-match"));
const sinon = require("sinon");
const sinonChai = require("sinon-chai");
chai.use(sinonChai);

const PacketConstructor = require("../../../lib/builders/packetConstructor");
const util = require("../../helpers/utils");

describe("INTEGRATION -- Services", async function() {
	const sandbox = sinon.createSandbox();

	this.timeout(30000);
	const Happner = require("happner-2");
	const Config = require("../../../config");

	const override = {
		logLevel: "info",
		name: "edge_state",
		db: "./tester.db",
		host: "0.0.0.0",
		port: 55007,
		logFile: "./test_edge.log",
		useEndpoint: false,
		endpointName: "edge_ssot",
		endpointIP: "0.0.0.0",
		endpointPort: 55008,
		endpointCheckInterval: 3000,
		endpointUsername: "UNIT001",
		endpointPassword: "happn",
		systemFiringTime: 120000,
		systemReportTime: 180000,
		communicationCheckInterval: 300000
	};

	context("Endpoint Service tests", async function() {
		//let consoleLogStub;
		let mesh, config;

		beforeEach(() => {
			sandbox.reset();
			//consoleLogStub = sandbox.stub(console, "log");
		});

		afterEach(() => {
			sandbox.restore();
		});
		it("can correctly start and stop the server with no endpoint", async function() {
			try {
				config = new Config(override).configuration;
				mesh = new Happner();

				await mesh.initialize(config);
				expect(mesh._mesh.initialized).to.be.true;
				console.log("INITIALIZED");

				await mesh.start();
				expect(mesh._mesh.started).to.be.true;
				console.log("STARTED");

				await util.timer(2000);
				console.log("STOPPING");
				await mesh.stop();
				expect(mesh._mesh.stopped).to.be.true;
				console.log("COMPLETE");
			} catch (err) {
				throw new Error(err);
			}
		});

		it("can correctly start and stop the server with endpoint enabled but will not connect", async function() {
			try {
				override.useEndpoint = true;
				config = new Config(override).configuration;
				mesh = new Happner();

				await mesh.initialize(config);

				console.log("INITIALIZED");
				expect(mesh._mesh.initialized).to.be.true;
				//const endpointServiceSpy = sandbox.spy(mesh.exchange.endpointService, "start");

				await mesh.start();
				console.log("STARTED");
				expect(mesh._mesh.started).to.be.true;
				//expect(endpointServiceSpy).to.have.been.calledOnce;
				await util.timer(10000);

				console.log("STOPPING");
				await mesh.stop();
				expect(mesh._mesh.stopped).to.be.true;

				console.log("COMPLETE");
			} catch (err) {
				throw new Error(err);
			}
		});

		it("can correctly start and stop the server with endpoint enabled and will connect", async () => {
			override.useEndpoint = true;
			config = new Config(override).configuration;

			const securityModule = {
				start: function($happn, callback) {
					const testUser = {
						username: "UNIT001",
						password: "happn",
						groups: { _ADMIN: true }
					};

					$happn.exchange.security.upsertUser(testUser, err => {
						if (err) return console.log("User  Error", err);
						console.log("User Upserted");
					});

					callback();
				}
			};

			const queueModule = {
				getActiveQueues: function($happn, callback) {
					console.log("getActive called");

					callback(null, []);
				},
				buildQueue: function($happn, user, from, callback) {
					console.log("EP BuildQueue called", user);

					callback();
				},
				size: function($happn, user, callback) {
					console.log("size called", user);
					callback(null, 0);
				}
			};

			const epMesh = await Happner.create({
				name: "edge_ssot",
				happn: {
					host: "0.0.0.0",
					port: 55008,
					secure: true,
					adminPassword: "happn"
				},
				modules: {
					securityService: {
						instance: securityModule
					},
					queueService: {
						instance: queueModule
					}
				},
				components: {
					securityService: {
						startMethod: "start"
					},
					queueService: {}
				}
			});

			mesh = new Happner();

			await mesh.initialize(config);

			console.log("INITIALIZED");
			expect(mesh._mesh.initialized).to.be.true;
			const endpointServiceSpy = sandbox.spy(mesh.exchange.endpointService, "start");

			await mesh.start();
			console.log("STARTED");
			expect(mesh._mesh.started).to.be.true;
			expect(endpointServiceSpy).to.have.been.calledOnce;
			await util.timer(10000);

			console.log("STOPPING");
			epMesh.stop();
			await mesh.stop();
			expect(mesh._mesh.stopped).to.be.true;
			console.log("COMPLETE");
		});

		it("can correctly connect to the endpoint and get 10 packets", async () => {
			override.useEndpoint = true;
			config = new Config(override).configuration;

			const securityModule = {
				start: function($happn, callback) {
					const testUser = {
						username: "UNIT001",
						password: "happn",
						groups: { _ADMIN: true }
					};

					$happn.exchange.security.upsertUser(testUser, err => {
						if (err) return console.log("User  Error", err);
						console.log("User Upserted");
					});

					callback();
				}
			};

			const queueModule = {
				queuesize: 10,
				flip: 0,
				getActiveQueues: function($happn, callback) {
					console.log("getActive called");

					callback(null, []);
				},
				buildQueue: function($happn, user, from, callback) {
					console.log("EP BuildQueue called", user);

					callback();
				},
				processIncoming: function($happn, callback) {
					console.log("WORKING");
					callback();
				},
				size: function($happn, user) {
					return new Promise((resolve, reject) => {
						console.log("size called", user);
						resolve(this.queuesize);
					});
				},
				dequeue: function($happn, user) {
					return new Promise((resolve, reject) => {
						const packet = {
							packet: new PacketConstructor(8, 8, {
								data: [0, 0, 0, 0, 0, 0, 0, this.flip]
							}).packet,
							createdAt: Date.now()
						};
						if (this.flip === 0) {
							this.flip = 1;
						} else {
							this.flip = 0;
						}
						this.queuesize--;
						resolve(packet);
					});
				}
			};

			const epMesh = await Happner.create({
				name: "edge_ssot",
				happn: {
					host: "0.0.0.0",
					port: 55008,
					secure: true,
					adminPassword: "happn"
				},
				modules: {
					securityService: {
						instance: securityModule
					},
					queueService: {
						instance: queueModule
					}
				},
				components: {
					securityService: {
						startMethod: "start"
					},
					queueService: {}
				}
			});

			mesh = new Happner();

			await mesh.initialize(config);

			console.log("INITIALIZED");
			expect(mesh._mesh.initialized).to.be.true;
			const endpointServiceSpy = sandbox.spy(mesh.exchange.endpointService, "start");

			await mesh.exchange.logsRepository.delete("*");
			await mesh.start();
			console.log("STARTED");
			expect(mesh._mesh.started).to.be.true;
			expect(endpointServiceSpy).to.have.been.calledOnce;

			const adminClient = new Happner.MeshClient({ secure: true, port: 55007 });
			await adminClient.login({ username: "OEM", password: "oem" });
			await util.timer(8000);

			const result = await adminClient.exchange.dataService.getSnapShot();
			const logs = await mesh.exchange.logsRepository.get("*");
			console.log(result);
			//console.log(logs);
			expect(logs.length).to.be.equal(10);
			await util.timer(2000);

			console.log("STOPPING");
			epMesh.stop();
			await mesh.stop();
			expect(mesh._mesh.stopped).to.be.true;
			console.log("COMPLETE");
		});

		it("can correctly handle a disconnection from the endpoint", async () => {
			try {
				override.useEndpoint = true;
				config = new Config(override).configuration;

				const securityModule = {
					start: function($happn, callback) {
						const testUser = {
							username: "UNIT001",
							password: "happn",
							groups: { _ADMIN: true }
						};

						$happn.exchange.security.upsertUser(testUser, err => {
							if (err) return console.log("User  Error", err);
							console.log("User Upserted");
						});

						callback();
					}
				};

				const queueModule = {
					queuesize: 10,
					flip: 0,
					getActiveQueues: function($happn, callback) {
						console.log("getActive called");

						callback(null, []);
					},
					buildQueue: function($happn, user, from, callback) {
						console.log("EP BuildQueue called", user);

						callback();
					},
					size: function($happn, user, callback) {
						console.log("size called", user);
						callback(null, this.queuesize);
					},
					dequeue: function($happn, user, callback) {
						const packet = {
							packet: new PacketConstructor(8, 8, {
								data: [0, 0, 0, 0, 0, 0, 0, this.flip]
							}).packet,
							createdAt: Date.now()
						};
						if (this.flip === 0) {
							this.flip = 1;
						} else {
							this.flip = 0;
						}
						this.queuesize--;
						callback(null, packet);
					}
				};

				const epMesh = await Happner.create({
					name: "edge_ssot",
					happn: {
						host: "0.0.0.0",
						port: 55008,
						secure: true,
						adminPassword: "happn"
					},
					modules: {
						securityService: {
							instance: securityModule
						},
						queueService: {
							instance: queueModule
						}
					},
					components: {
						securityService: {
							startMethod: "start"
						},
						queueService: {}
					}
				});

				mesh = new Happner();

				await mesh.initialize(config);

				console.log("INITIALIZED");
				expect(mesh._mesh.initialized).to.be.true;
				const endpointServiceSpy = sandbox.spy(mesh.exchange.endpointService, "start");
				await mesh.exchange.logsRepository.delete("*");
				await mesh.start();
				console.log("STARTED");
				expect(mesh._mesh.started).to.be.true;
				expect(endpointServiceSpy).to.have.been.calledOnce;

				const adminClient = new Happner.MeshClient({ secure: true, port: 55007 });
				await adminClient.login({ username: "OEM", password: "oem" });
				await util.timer(4000);

				console.log("STOPPING ENDPOINT");
				epMesh.stop();
				await util.timer(4000);

				const result = await adminClient.exchange.dataService.getSnapShot();
				const logs = await mesh.exchange.logsRepository.get("*");
				console.log(result);
				//console.log(logs);
				expect(logs.length).to.be.equal(10);
				await util.timer(2000);

				console.log("STOPPING");
				await mesh.stop();
				expect(mesh._mesh.stopped).to.be.true;
				console.log("COMPLETE");
			} catch (err) {
				throw new Error(err);
			}
		});

		it("can correctly handle a disconnection and a reconnect from the endpoint", async () => {
			try {
				override.useEndpoint = true;
				config = new Config(override).configuration;

				const securityModule = {
					start: function($happn, callback) {
						const testUser = {
							username: "UNIT001",
							password: "happn",
							groups: { _ADMIN: true }
						};

						$happn.exchange.security.upsertUser(testUser, err => {
							if (err) return console.log("User  Error", err);
							console.log("User Upserted");
						});

						callback();
					}
				};

				const queueModule = {
					queuesize: 10,
					flip: 0,
					getActiveQueues: function($happn, callback) {
						console.log("getActive called");

						callback(null, []);
					},
					buildQueue: function($happn, user, from, callback) {
						console.log("EP BuildQueue called", user);

						callback();
					},
					size: function($happn, user, callback) {
						console.log("size called", user);
						callback(null, this.queuesize);
					},
					dequeue: function($happn, user, callback) {
						const packet = {
							packet: new PacketConstructor(8, 8, {
								data: [0, 0, 0, 0, 0, 0, 0, this.flip]
							}).packet,
							createdAt: Date.now()
						};
						if (this.flip === 0) {
							this.flip = 1;
						} else {
							this.flip = 0;
						}
						this.queuesize--;
						callback(null, packet);
					}
				};

				const epConfig = {
					name: "edge_ssot",
					happn: {
						host: "0.0.0.0",
						port: 55008,
						secure: true,
						adminPassword: "happn"
					},
					modules: {
						securityService: {
							instance: securityModule
						},
						queueService: {
							instance: queueModule
						}
					},
					components: {
						securityService: {
							startMethod: "start"
						},
						queueService: {}
					}
				};

				const epMesh = await Happner.create(epConfig);

				mesh = new Happner();

				await mesh.initialize(config);

				console.log("INITIALIZED");
				expect(mesh._mesh.initialized).to.be.true;
				const endpointServiceSpy = sandbox.spy(mesh.exchange.endpointService, "start");
				await mesh.exchange.logsRepository.delete("*");
				await mesh.start();
				console.log("STARTED");
				expect(mesh._mesh.started).to.be.true;
				expect(endpointServiceSpy).to.have.been.calledOnce;

				const adminClient = new Happner.MeshClient({ secure: true, port: 55007 });
				await adminClient.login({ username: "OEM", password: "oem" });
				await util.timer(4000);

				console.log("STOPPING ENDPOINT");
				await new Promise(resolve => {
					epMesh.stop(
						{
							kill: false, // kill the process once stopped
							reconnect: true // inform attached clients/endpoints to reconnect
						},
						() => {
							console.log("EP STOPPED");
							resolve();
						}
					);
				});

				await util.timer(2000);

				console.log("RESTARTING ENDPOINT");
				await epMesh.initialize(epConfig);
				await epMesh.start();
				expect(epMesh._mesh.started).to.be.true;

				await util.timer(6000);

				const result = await adminClient.exchange.dataService.getSnapShot();
				const logs = await mesh.exchange.logsRepository.get("*");
				console.log(result);

				expect(logs.length).to.be.equal(20);
				await util.timer(2000);

				console.log("STOPPING");
				await mesh.stop();
				expect(mesh._mesh.stopped).to.be.true;
				console.log("COMPLETE");
			} catch (err) {
				console.log(err);
				throw new Error(err);
			}
		});
	});
});
