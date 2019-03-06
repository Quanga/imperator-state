const expect = require("expect.js");
const RequestHelper = require("../helpers/request_helper");

describe("AXXIS - CBB data test", function () {
	const ServerHelper = require("../helpers/server_helper");
	let serverHelper = new ServerHelper();

	const FileHelper = require("../helpers/file_helper");
	const fileHelper = new FileHelper();

	const DatabaseHelper = require("../helpers/database_helper");
	const databaseHelper = new DatabaseHelper();

	const SerialPortHelper = require("../helpers/serial_port_helper");
	const serialPortHelper = new SerialPortHelper();

	const PacketConstructor = require("../../lib/builders/packetConstructor");

	this.timeout(30000);

	before("cleaning up queues", async function () {
		await fileHelper.clearQueueFiles();
	});

	beforeEach("cleaning up db", async function () {
		try {
			await databaseHelper.initialise();
			await databaseHelper.clearDatabase();
			serverHelper = new ServerHelper();

			await serverHelper.startServer();
		} catch (err) {
			return Promise.reject(err);
		}
	});

	afterEach("stop test server", async function () {
		await serverHelper.stopServer();
		await timer(2000);

	});

	let timer = ms => {
		return new Promise(resolve => setTimeout(resolve, ms));
	};

	it("can process a packet with CBBs Data 1 where no CBBs currently in database", async function () {
		let step1 = async function () {
			let initial = new PacketConstructor(8, 8, {
				data: [0, 0, 0, 0, 0, 0, 0, 1]
			}).packet;
			await serialPortHelper.sendMessage(initial);

			const message = new PacketConstructor(5, 13, {
				data: [
					{
						serial: 13,
						window_id: 2,
						ledState: 6,
						rawData: [0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1]
					}
				]
			}).packet;
			await serialPortHelper.sendMessage(message);
		};

		let step2 = async function () {
			let result = await databaseHelper.getNodeTreeData(8, 0);
			if (result == null || result.length == 0)
				return new Error("Empty result!");

			let cbb = null;

			result.forEach(x => {
				if (parseInt(x["c.serial"]) === 13 && x["c.type_id"] === 3) cbb = x;
			});

			return { cbb: cbb };
		};

		let step3 = async function (result) {
			try {
				expect(result.cbb["c.communication_status"]).to.equal(1); // communication status
			} catch (err) {
				return Promise.reject(err);
			}
		};

		let startTest = async function () {
			try {
				await step1();
				await timer(2000);
				let result = await step2();
				await step3(result);
			} catch (err) {
				return Promise.reject(err);
			}
		};

		return startTest();
	});

	it("can process a packet with CBBs and EDD Data 1 where no CBBs currently in database", async function () {
		let step1 = async function () {
			let initial = new PacketConstructor(8, 8, {
				data: [0, 0, 0, 0, 0, 0, 0, 1]
			}).packet;
			await serialPortHelper.sendMessage(initial);

			const initial2 = new PacketConstructor(4, 13, {
				data: [
					{ serial: 4423423, window_id: 1 },
					{ serial: 4523434, window_id: 2 }
				]
			}).packet;
			await serialPortHelper.sendMessage(initial2);

			const message = new PacketConstructor(5, 13, {
				data: [
					{
						serial: 13,
						window_id: 2,
						ledState: 6,
						rawData: [0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1]
					},
					{
						window_id: 2,
						rawData: [1, 0, 0, 0, 0, 0, 0, 1],
						delay: 2000
					}
				]
			}).packet;
			await serialPortHelper.sendMessage(message);
		};

		let step2 = async function () {
			let result = await databaseHelper.getNodeTreeData(8, 0);
			if (result == null || result.length == 0)
				return new Error("Empty result!");

			let cbb = null,
				edd1 = null;

			result.forEach(x => {
				if (parseInt(x["c.serial"]) === 13 && x["c.type_id"] === 3) cbb = x;
				if (parseInt(x["g.serial"]) === 4523434 && x["g.type_id"] === 4)
					edd1 = x;
			});

			return { cbb: cbb, edd1: edd1 };
		};

		let step3 = async function (result) {
			try {
				expect(result.cbb["c.communication_status"]).to.equal(1); // communication status
				expect(result.edd1["g.window_id"]).to.equal(2); // communication status
				expect(result.edd1["g.delay"]).to.equal(2000); // communication status
			} catch (err) {
				return Promise.reject(err);
			}
		};

		let startTest = async function () {
			try {
				await step1();
				await timer(2000);
				let result = await step2();
				await step3(result);
			} catch (err) {
				return Promise.reject(err);
			}
		};

		return startTest();
	});

	it("can process a packet with CBBs and EDD Data 1 where  CBBs  and EDD currently in database", async function () {
		let step1 = async function () {
			let initial = new PacketConstructor(8, 8, {
				data: [0, 0, 0, 0, 0, 0, 0, 1]
			}).packet;
			await serialPortHelper.sendMessage(initial);

			const initial2 = new PacketConstructor(4, 13, {
				data: [
					{ serial: 4423423, window_id: 1 },
					{ serial: 4523434, window_id: 2 }
				]
			}).packet;
			await serialPortHelper.sendMessage(initial2);

			const message = new PacketConstructor(5, 13, {
				data: [
					{
						serial: 13,
						window_id: 2,
						ledState: 6,
						rawData: [0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1]
					},
					{
						window_id: 2,
						rawData: [1, 0, 0, 0, 0, 0, 0, 1],
						delay: 2000
					}
				]
			}).packet;
			await serialPortHelper.sendMessage(message);

			const message2 = new PacketConstructor(5, 13, {
				data: [
					{
						serial: 13,
						window_id: 2,
						ledState: 6,
						rawData: [0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 1, 1]
					},
					{
						window_id: 2,
						rawData: [1, 0, 0, 0, 0, 1, 1, 1],
						delay: 3000
					}
				]
			}).packet;
			await serialPortHelper.sendMessage(message2);
		};

		let step2 = async function () {
			let result = await databaseHelper.getNodeTreeData(8, 0);
			if (result == null || result.length == 0)
				return new Error("Empty result!");

			let cbb = null,
				edd1 = null;

			result.forEach(x => {
				if (parseInt(x["c.serial"]) === 13 && x["c.type_id"] === 3) cbb = x;
				if (parseInt(x["g.serial"]) === 4523434 && x["g.type_id"] === 4)
					edd1 = x;
			});

			return { cbb: cbb, edd1: edd1 };
		};

		let step3 = async function (result) {
			try {
				expect(result.cbb["c.communication_status"]).to.equal(1); // communication status
				expect(result.edd1["g.window_id"]).to.equal(2); // communication status
				expect(result.edd1["g.delay"]).to.equal(3000); // communication status
			} catch (err) {
				return Promise.reject(err);
			}
		};

		let startTest = async function () {
			try {
				await step1();
				await timer(2000);
				let result = await step2();
				await step3(result);
			} catch (err) {
				return Promise.reject(err);
			}
		};

		return startTest();
	});

	it("can process a change packet with CBBs and EDD Data 1 where  CBBs and EDD currently in database", async function () {
		let step1 = async function () {
			const data1 = {
				data: [0, 0, 0, 0, 0, 0, 0, 1]
			};

			let initial = new PacketConstructor(8, 8, data1);
			await serialPortHelper.sendMessage(initial.packet);

			const data2 = {
				data: [
					{ serial: 4423423, window_id: 1 },
					{ serial: 4523434, window_id: 2 }
				]
			};

			await timer(2000);

			const initial2 = new PacketConstructor(4, 13, data2);
			await serialPortHelper.sendMessage(initial2.packet);

			const data3 = {
				data: [
					{
						serial: 13,
						window_id: 2,
						ledState: 6,
						rawData: [0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1]
					},
					{
						window_id: 2,
						rawData: [1, 0, 0, 0, 0, 0, 0, 1],
						delay: 2000
					}
				]
			};

			const message = new PacketConstructor(5, 13, data3);
			await serialPortHelper.sendMessage(message.packet);

			const data4 = {
				data: [
					{
						serial: 13,
						window_id: 2,
						ledState: 6,
						rawData: [0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 1, 0]
					},
					{
						window_id: 2,
						rawData: [1, 0, 0, 0, 0, 1, 1, 1],
						delay: 3000
					}
				]
			};

			const message2 = new PacketConstructor(5, 13, data4);
			await serialPortHelper.sendMessage(message2.packet);

			const data6 = {
				data: [
					{
						serial: 13,
						window_id: 2,
						ledState: 6,
						rawData: [0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 1, 0, 1, 1, 1]
					},
					{
						window_id: 2,
						rawData: [1, 0, 0, 0, 0, 1, 1, 1],
						delay: 3000
					}
				]
			};

			const message4 = new PacketConstructor(5, 13, data6);
			await serialPortHelper.sendMessage(message4.packet);
		};

		let step2a = async function () {
			try {
				let requestHelper = new RequestHelper();
				let result = await requestHelper.getBlastModel();

				return result;
			} catch (err) {
				return Promise.reject(err);
			}
		};

		let step2 = async function () {
			let result = await databaseHelper.getNodeTreeData(8, 0);
			if (result == null || result.length == 0)
				return new Error("Empty result!");

			let cbb = null,
				edd1 = null;

			result.forEach(x => {
				if (parseInt(x["c.serial"]) === 13 && x["c.type_id"] === 3) cbb = x;
				if (parseInt(x["g.serial"]) === 4523434 && x["g.type_id"] === 4)
					edd1 = x;
			});

			return { cbb: cbb, edd1: edd1 };
		};

		let step3 = async function (resulta, requestb) {
			try {
				expect(resulta.cbb["c.communication_status"]).to.equal(1); // communication status
				expect(resulta.edd1["g.window_id"]).to.equal(2); // communication status
				expect(resulta.edd1["g.delay"]).to.equal(3000); // communication status


				console.log(JSON.stringify(requestb, null, 2));
				let edds = requestb.find(x => x.type_id === 4);
				expect(edds).to.be.equal(null);
			} catch (err) {
				return Promise.reject(err);
			}
		};

		let startTest = async function () {
			try {
				await step1();
				await timer(4000);
				let result = await step2();
				let resultb = await step2a();

				await step3(result, resultb);
			} catch (err) {
				return Promise.reject(err);
			}
		};

		return startTest();
	});
});


// :::: RESULT::: [{
// 	id: 15106,
// 	serial: 8,
// 	parent_serial: null,
// 	type_id: 0,
// 	parent_type: null,
// 	parent_id: null,
// 	window_id: null,
// 	created: '2019-03-05 11:31:01',
// 	modified: '2019-03-05 11:31:01',
// 	communication_status: 1,
// 	key_switch_status: 1,
// 	fire_button: 0,
// 	cable_fault: 0,
// 	isolation_relay: 0,
// 	earth_leakage: 0,
// 	blast_armed: 0
// },
// {
// 	id: 15107,
// 	serial: 13,
// 	parent_serial: null,
// 	type_id: 3,
// 	parent_type: 0,
// 	parent_id: 15106,
// 	window_id: 1,
// 	created: '2019-03-05 11:31:01',
// 	modified: '2019-03-05T11:31:04',
// 	communication_status: 1,
// 	blast_armed: 0,
// 	key_switch_status: 1,
// 	isolation_relay: 0,
// 	mains: 0,
// 	low_bat: 1,
// 	too_low_bat: 0,
// 	DC_supply_voltage_status: 0,
// 	shaft_fault: 0,
// 	cable_fault: 1,
// 	earth_leakage: 1,
// 	led_state: 6
// }]
