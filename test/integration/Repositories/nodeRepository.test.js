/* eslint-disable no-unused-vars */
var chai = require("chai");
var expect = chai.expect;
var chaiAsPromised = require("chai-as-promised");

chai.use(chaiAsPromised);
const should = chai.should();
var Mesh = require("happner-2");

const ServerHelper = require("../../helpers/server_helper");

describe("INTEGRATION - Repositories", async function() {
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
				port: 55000
			});

			client.on("login/allow", () => resolve());
			client.on("login/deny", () => reject());
			client.on("login/error", () => reject());
			client.login({
				username: "_ADMIN",
				password: "happn"
			});
		});

	xcontext("NodeRepository", async () => {
		before("cleaning up db", async function() {
			try {
				// await serialPortHelper.initialise();
				await serverHelper.startServer();
				await AsyncLogin();
			} catch (err) {
				return Promise.reject(err);
			}
		});

		beforeEach("delete all current nodes", async function() {
			await client.exchange.nodeRepository.delete("*");
			await client.exchange.logsRepository.deleteAll();
			await client.exchange.warningsRepository.deleteAll();
			await client.exchange.blastRepository.delete("*");
		});

		after("stop test server", async function() {
			client.disconnect();
			await serverHelper.stopServer();
			// await serialPortHelper.destroy();
		});

		xit("can initialize the nodeRepository", async () => {
			const { nodeRepository } = client.exchange;

			nodeRepository.initialize();
		});

		it("can delete all node path data", async function() {
			const { nodeRepository, data } = client.exchange;

			const step1 = () =>
				new Promise((resolve, reject) => {
					data.set("persist/nodes/", { test: "data" }, {}, (err, response) => {
						if (err) return reject(err);

						resolve(response);
					});
				});

			await timer(200);

			const getAtPath = () =>
				new Promise((resolve, reject) => {
					data.get("persist/nodes/*", null, (err, response) => {
						if (err) return reject(err);

						resolve(response);
					});
				});

			const test = async () => {
				await step1();
				let res = await getAtPath();
				expect(res.length).to.eql(1);
				expect(res[0].test).to.eql("data");
				await nodeRepository.delete("*");
				let resp2 = await getAtPath();
				expect(resp2.length).to.eql(0);
			};

			return test();
		});

		it("can get all nodes on  the nodes data path", async function() {
			const { nodeRepository, data } = client.exchange;

			const controlUnit = {
				serial: 12,
				parentSerial: null,
				typeId: 0,
				parent_type: null,
				createdAt: null,
				modifiedAt: null,
				path: "0/12",
				communicationStatus: 1,
				keySwitchStatus: 0,
				fireButton: 0,
				cableFault: 0,
				isolationRelay: 0,
				earthLeakage: 0,
				blastArmed: 0
			};

			let loadData = () =>
				new Promise((resolve, reject) => {
					data.set("persist/nodes/0/12", controlUnit, {}, (err, response) => {
						if (err) return reject(err);

						resolve(response);
					});
				});

			await loadData();
			let res = await nodeRepository.getAllNodes();
			expect(res.length).to.eql(1);
			expect(res[0].data.serial).to.eql(12);
		});

		it("can write a node on the nodes data path using the data objects path variable", async function() {
			const { nodeRepository, data } = client.exchange;

			const controlUnit = {
				serial: 12,
				parentSerial: null,
				typeId: 0,
				parent_type: null,
				createdAt: null,
				modifiedAt: null,
				path: "0/12",
				communicationStatus: 1,
				keySwitchStatus: 0,
				fireButton: 0,
				cableFault: 0,
				isolationRelay: 0,
				earthLeakage: 0,
				blastArmed: 0
			};

			const getAtPath = () =>
				new Promise((resolve, reject) => {
					data.get("persist/nodes/0/12", null, (err, response) => {
						if (err) return reject(err);

						resolve(response);
					});
				});

			await nodeRepository.insertNodeData(controlUnit);
			let res = await getAtPath();
			expect(res.serial).to.eql(12);
		});

		it("can reject a node on insert if there is no  path variable", async function() {
			const { nodeRepository } = client.exchange;

			const controlUnit = {
				serial: 12,
				parentSerial: null,
				typeId: 0,
				parent_type: null,
				createdAt: null,
				modifiedAt: null,
				communicationStatus: 1,
				keySwitchStatus: 0,
				fireButton: 0,
				cableFault: 0,
				isolationRelay: 0,
				earthLeakage: 0,
				blastArmed: 0
			};

			await nodeRepository
				.insertNodeData(controlUnit)
				.should.be.rejectedWith("No Path suppied in object");
		});

		it("can update a node on the nodes data path and hear emit", async function() {
			const { nodeRepository, data } = client.exchange;
			let emitResult = null;

			client.event.nodeRepository.on(
				"nodes/updated", // wildcards are supported
				function(data, meta) {
					emitResult = data;
				},
				function(error, _eventRef) {
					if (error) {
						// failed to subscribe
						return;
					}
					//eventRef = _eventRef;
				}
			);

			let controlUnit = {
				serial: 12,
				parentSerial: null,
				typeId: 0,
				parent_type: null,
				createdAt: null,
				modifiedAt: null,
				path: "0/12",
				communicationStatus: 1,
				keySwitchStatus: 0,
				fireButton: 0,
				cableFault: 0,
				isolationRelay: 0,
				earthLeakage: 0,
				blastArmed: 0
			};

			const getAtPath = () =>
				new Promise((resolve, reject) => {
					data.get("persist/nodes/0/12", null, (err, response) => {
						if (err) return reject(err);

						resolve(response);
					});
				});

			await nodeRepository.insertNodeData(controlUnit);
			let res = await getAtPath();
			expect(2).to.eql(2);

			expect(res.serial).to.eql(12);
			expect(res.keySwitchStatus).to.eql(0);

			controlUnit = {
				serial: 12,
				parentSerial: null,
				typeId: 0,
				parent_type: null,
				createdAt: null,
				modifiedAt: null,
				path: "0/12",
				communicationStatus: 1,
				keySwitchStatus: 1,
				fireButton: 0,
				cableFault: 0,
				isolationRelay: 1,
				earthLeakage: 0,
				blastArmed: 0
			};
			let result2 = await nodeRepository.updateNodeData(controlUnit);
			await expect(result2.keySwitchStatus).to.eql(1);
			/* the emmitted item
				 {
					serial: nodeObj.serial,
					typeId: nodeObj.typeId,
					modifiedAt: Date.now(),
					changes: check
				}
				*/

			expect(emitResult).to.not.eql(null);
			expect(Object.keys(emitResult.changes).length).to.eql(2);
			expect(emitResult.serial).to.eql(12);

			client.event.nodeRepository.offPath("nodes/updated", function(error) {
				if (error) {
					// failed to unsubscribe
					return;
				}
			});
		});
	});
});
