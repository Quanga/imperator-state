const expect = require("expect.js");
const ServerHelper = require("../helpers/server_helper");
const SerialPortHelper = require("../helpers/serial_port_helper");
const PacketConstructor = require("../../lib/builders/packetConstructor");
var Mesh = require("happner-2");

require("dotenv").config();

describe("EVENT SERVICE tests for AXXIS", async function() {
	let serverHelper = new ServerHelper();
	const serialPortHelper = new SerialPortHelper();
	let client;

	this.timeout(60000);

	let timer = ms => {
		return new Promise(resolve => setTimeout(resolve, ms));
	};

	const AsyncLogin = () =>
		new Promise((resolve, reject) => {
			client.on("login/allow", () => resolve());

			client.on("login/deny", () => reject());
			client.on("login/error", () => reject());
			client.login({
				username: "_ADMIN",
				password: "happn"
			});
		});

	before("cleaning up db", async function() {
		try {
			await serialPortHelper.initialise();
			await serverHelper.startServer();

			client = await new Mesh.MeshClient({
				secure: true,
				port: 55000
			});

			await AsyncLogin();
		} catch (err) {
			return Promise.reject(err);
		}
	});

	beforeEach("delete all current nodes", async function() {
		client.exchange.nodeRepository.deleteAll();
		await timer(1000);
	});

	after("stop test server", async function() {
		client.disconnect();
		await serverHelper.stopServer();
		await serialPortHelper.destroy();
		await timer(2000);
	});

	it("can open and close a blast event using only Control Unit fire switch", async function() {
		let requ = async () => {
			try {
				//let requestHelper = new RequestHelper();
				let result = await client.exchange.eventService.getBlastModel();
				return result;
			} catch (err) {
				return Promise.reject(err);
			}
		};

		let step1 = async () => {
			try {
				let result;

				result = await requ();
				//expect(result.blastNodes.length).to.equal(0);

				//load database with cu
				let initial = new PacketConstructor(8, 8, {
					data: [0, 0, 0, 0, 0, 0, 0, 0]
				}).packet;
				await serialPortHelper.sendMessage(initial);

				await timer(2000);
				result = await requ();
				console.log("BLASTNODES:::::::::::", result.blastNodes[0]);
				//expect(result.blastNodes[0].data.key_switch_status).to.equal(0);

				//arm the CU
				let ksOn = new PacketConstructor(8, 8, {
					data: [0, 0, 0, 1, 0, 0, 0, 1]
				}).packet;
				await serialPortHelper.sendMessage(ksOn);

				await timer(2000);
				result = await requ();
				expect(result.blastNodes[0].data.key_switch_status).to.equal(1);
			} catch (err) {
				return Promise.reject(err);
			}
		};

		let step2 = async () => {
			try {
				let result;
				await timer(3000);

				//press the fire button
				let fb = new PacketConstructor(8, 8, { data: [0, 0, 0, 0, 0, 1, 0, 1] })
					.packet;
				await serialPortHelper.sendMessage(fb);

				await timer(1000);
				result = await requ();
				expect(result.blastNodes[0].data.fire_button).to.equal(1);
				expect(result.systemState.firingState).to.equal("FIRING");

				await timer(4000);
				result = await requ();
				expect(result.systemState.firingState).to.equal("FIRED");
				expect(result.systemState.armedState).to.equal("ARMED");

				//firing complete

				let fbOff = new PacketConstructor(8, 8, {
					data: [0, 0, 0, 0, 0, 0, 0, 1]
				}).packet;
				await serialPortHelper.sendMessage(fbOff);

				await timer(3000);
				result = await requ();
				expect(result.blastNodes[0].data.fire_button).to.equal(0);
				expect(result.blastNodes[0].data.key_switch_status).to.equal(1);

				//CU Disarmed
				let ksOff = new PacketConstructor(8, 8, {
					data: [0, 0, 0, 0, 0, 0, 0, 0]
				}).packet;
				await serialPortHelper.sendMessage(ksOff);

				await timer(4000);
				result = await requ();
				console.log(result);

				expect(
					result.blastNodesHistory[0].state.snapshots.end.fire_button
				).to.equal(0);
				expect(
					result.blastNodesHistory[0].state.snapshots.end.key_switch_status
				).to.equal(0);

				console.log(JSON.stringify(result));
			} catch (err) {
				return Promise.reject(err);
			}
		};

		let test = async () => {
			try {
				await timer(3000);

				await step1();
				await step2();
			} catch (err) {
				return Promise.reject(err);
			}
		};

		return test();
	});

	it("can add a cbb with 2 EDDs to the blast event", async function() {
		let requ = async () => {
			let requestHelper = new RequestHelper();
			let result = await requestHelper.getBlastModel();
			return result;
		};

		let step1 = async () => {
			try {
				let result;

				result = await requ();
				expect(result.blastNodes.length).to.equal(0);

				//load database with cu
				let cuInitial = new PacketConstructor(8, 8, {
					data: [0, 0, 0, 0, 0, 0, 0, 0]
				}).packet;

				await serialPortHelper.sendMessage(cuInitial);

				let cbbInitial = new PacketConstructor(4, 22, {
					data: [
						{ serial: 4423423, windowId: 1 },
						{ serial: 4523434, windowId: 2 }
					]
				}).packet;

				await serialPortHelper.sendMessage(cbbInitial);

				let cbbInitialData = new PacketConstructor(5, 22, {
					data: [
						{
							serial: 22,
							windowId: 2,
							ledState: 6,
							rawData: [0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1]
						},
						{
							windowId: 2,
							rawData: [1, 0, 0, 0, 0, 0, 0, 1],
							delay: 2000
						}
					]
				}).packet;

				await serialPortHelper.sendMessage(cbbInitialData);

				await timer(2000);
				result = await requ();
				expect(result.blastNodes[0].data.key_switch_status).to.equal(0);

				//arm the CU
				let ksOn = new PacketConstructor(8, 8, {
					data: [0, 0, 0, 1, 0, 0, 0, 1]
				}).packet;
				await serialPortHelper.sendMessage(ksOn);

				await timer(1000);
				result = await requ();
				expect(result.blastNodes[0].data.key_switch_status).to.equal(1);
			} catch (err) {
				return Promise.reject(err);
			}
		};

		let step2 = async () => {
			try {
				let result;
				await timer(2000);

				//press the fire button
				let fb = new PacketConstructor(8, 8, {
					data: [0, 0, 0, 0, 0, 1, 0, 1]
				}).packet;
				await serialPortHelper.sendMessage(fb);

				await timer(2000);
				result = await requ();
				expect(result.blastNodes[0].data.fire_button).to.equal(1);
				expect(result.systemState.firingState).to.equal("FIRING");

				await timer(3000);
				result = await requ();
				expect(result.systemState.firingState).to.equal("FIRED");
				expect(result.systemState.armedState).to.equal("ARMED");

				//firing complete

				let fbOff = new PacketConstructor(8, 8, {
					data: [0, 0, 0, 0, 0, 0, 0, 1]
				}).packet;
				await serialPortHelper.sendMessage(fbOff);

				await timer(3000);
				result = await requ();
				expect(result.blastNodes[0].data.fire_button).to.equal(0);
				expect(result.blastNodes[0].data.key_switch_status).to.equal(1);

				//CU Disarmed
				let ksOff = new PacketConstructor(8, 8, {
					data: [0, 0, 0, 0, 0, 0, 0, 0]
				}).packet;
				await serialPortHelper.sendMessage(ksOff);

				await timer(1000);

				let cbbDisarmData = new PacketConstructor(5, 22, {
					data: [
						{
							serial: 22,
							windowId: 2,
							ledState: 6,
							rawData: [0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0]
						},
						{
							windowId: 2,
							rawData: [1, 0, 0, 0, 0, 0, 0, 1],
							delay: 2000
						}
					]
				}).packet;

				await serialPortHelper.sendMessage(cbbDisarmData);
				await timer(3500);

				result = await requ();
				expect(result.blastNodes[0].data.fire_button).to.equal(0);
				expect(result.blastNodes[0].data.key_switch_status).to.equal(0);
				console.log(JSON.stringify(result));

				let cbbArm2Data = new PacketConstructor(5, 22, {
					data: [
						{
							serial: 22,
							windowId: 2,
							ledState: 6,
							rawData: [0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1]
						}
					]
				}).packet;

				await serialPortHelper.sendMessage(cbbArm2Data);
				await timer(2000);
				let requestHelper = new RequestHelper();
				let resultAll = await requestHelper.getAllBlastModels();
				expect(resultAll.length).to.be(2);
				expect(resultAll[1].blastNodes.length).to.be(2);

				console.log(JSON.stringify(resultAll));
			} catch (err) {
				return Promise.reject(err);
			}
		};

		let test = async () => {
			try {
				await timer(4000);
				await step1();
				await step2();
			} catch (err) {
				return Promise.reject(err);
			}
		};

		return test();
	});

	it("can add a cbb with 2 EDDs to the blast event twice", async function() {
		let requ = async () => {
			let requestHelper = new RequestHelper();
			let result = await requestHelper.getBlastModel();
			return result;
		};

		let step1 = async () => {
			try {
				let result;

				result = await requ();
				//expect(result.blastNodes.length).to.equal(0);

				//load database with cu
				let cuInitial = new PacketConstructor(8, 8, {
					data: [0, 0, 0, 0, 0, 0, 0, 0]
				}).packet;

				await serialPortHelper.sendMessage(cuInitial);

				let cbbInitial = new PacketConstructor(4, 22, {
					data: [
						{ serial: 4423423, windowId: 1 },
						{ serial: 4523434, windowId: 2 }
					]
				}).packet;

				await serialPortHelper.sendMessage(cbbInitial);

				let cbbInitialData = new PacketConstructor(5, 22, {
					data: [
						{
							serial: 22,
							windowId: 2,
							ledState: 6,
							rawData: [0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1]
						},
						{
							windowId: 2,
							rawData: [1, 0, 0, 0, 0, 0, 0, 1],
							delay: 2000
						}
					]
				}).packet;

				await serialPortHelper.sendMessage(cbbInitialData);

				await timer(2000);
				result = await requ();
				expect(result.blastNodes[0].data.key_switch_status).to.equal(0);

				//arm the CU
				let ksOn = new PacketConstructor(8, 8, {
					data: [0, 0, 0, 1, 0, 0, 0, 1]
				}).packet;
				await serialPortHelper.sendMessage(ksOn);

				await timer(1000);
				result = await requ();
				expect(result.blastNodes[0].data.key_switch_status).to.equal(1);
			} catch (err) {
				return Promise.reject(err);
			}
		};

		let step2 = async () => {
			try {
				let result;
				await timer(2000);

				//press the fire button
				let fb = new PacketConstructor(8, 8, {
					data: [0, 0, 0, 0, 0, 1, 0, 1]
				}).packet;
				await serialPortHelper.sendMessage(fb);

				await timer(2000);
				result = await requ();
				expect(result.blastNodes[0].data.fire_button).to.equal(1);
				expect(result.systemState.firingState).to.equal("FIRING");

				await timer(3000);
				result = await requ();
				expect(result.systemState.firingState).to.equal("FIRED");
				expect(result.systemState.armedState).to.equal("ARMED");

				//firing complete

				let fbOff = new PacketConstructor(8, 8, {
					data: [0, 0, 0, 0, 0, 0, 0, 1]
				}).packet;
				await serialPortHelper.sendMessage(fbOff);

				await timer(3000);
				result = await requ();
				expect(result.blastNodes[0].data.fire_button).to.equal(0);
				expect(result.blastNodes[0].data.key_switch_status).to.equal(1);

				//CU Disarmed
				let ksOff = new PacketConstructor(8, 8, {
					data: [0, 0, 0, 0, 0, 0, 0, 0]
				}).packet;
				await serialPortHelper.sendMessage(ksOff);

				await timer(1000);

				let cbbDisarmData = new PacketConstructor(5, 22, {
					data: [
						{
							serial: 22,
							windowId: 2,
							ledState: 6,
							rawData: [0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0]
						},
						{
							windowId: 2,
							rawData: [1, 0, 0, 0, 0, 0, 0, 1],
							delay: 2000
						}
					]
				}).packet;

				await serialPortHelper.sendMessage(cbbDisarmData);
				await timer(3500);

				result = await requ();
				expect(result.blastNodes[0].data.fire_button).to.equal(0);
				expect(result.blastNodes[0].data.key_switch_status).to.equal(0);
				console.log(JSON.stringify(result));

				let cbbArm2Data = new PacketConstructor(5, 22, {
					data: [
						{
							serial: 22,
							windowId: 2,
							ledState: 6,
							rawData: [0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1]
						}
					]
				}).packet;

				await serialPortHelper.sendMessage(cbbArm2Data);
				await timer(2000);
				let requestHelper = new RequestHelper();
				let resultAll = await requestHelper.getAllBlastModels();
				//expect(resultAll.length).to.be(2);
				//expect(resultAll[1].blastNodes.length).to.be(2);

				console.log(JSON.stringify(resultAll));
			} catch (err) {
				return Promise.reject(err);
			}
		};

		let test = async () => {
			try {
				for (let x = 0; x < 2; x++) {
					await timer(4000);
					await step1();
					await step2();
				}
			} catch (err) {
				return Promise.reject(err);
			}
		};

		return test();
	});
});
