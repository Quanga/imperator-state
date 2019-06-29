/* eslint-disable no-unused-vars */
const expect = require("expect.js");
var Mesh = require("happner-2");
const ServerHelper = require("../../helpers/server_helper");
const PacketConstructor = require("../../../lib/builders/packetConstructor");

describe("IBS - 651 data test", async function() {
	this.timeout(20000);

	const RequestHelper = require("../../helpers/request_helper");

	let serverHelper = new ServerHelper();

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

	before("cleaning up db", async function() {
		try {
			//await serialPortHelper.initialise();
			await serverHelper.startServer();
			await AsyncLogin();
		} catch (err) {
			return Promise.reject(err);
		}
	});

	beforeEach("delete all current nodes", async function() {
		client.exchange.nodeRepository.deleteAll();
	});

	after("stop test server", async function() {
		client.disconnect();
		await serverHelper.stopServer();
		//await serialPortHelper.destroy();
	});

	it("can process a data packet containing one ISC with IB651s 1, 2 & 3", async function() {
		let step1 = async () => {
			let startMessage = new PacketConstructor(8, 12, {
				data: [0, 0, 0, 0, 0, 0, 0, 0]
			}).packet;
			//await serialPortHelper.sendMessage(startMessage);

			let pingMessage = new PacketConstructor(1, 12, {
				data: [27]
			}).packet;
			//await serialPortHelper.sendMessage(pingMessage);

			let initial = new PacketConstructor(2, 27, {
				data: [33]
			}).packet;
			//await serialPortHelper.sendMessage(initial);

			let initial2 = new PacketConstructor(2, 27, {
				data: [33, 34, 35]
			}).packet;
			//await serialPortHelper.sendMessage(initial2);

			const finalmessage = new PacketConstructor(3, 27, {
				data: [
					[0, 0, 0, 0, 0, 1, 0, 0],
					[0, 0, 0, 0, 0, 0, 1, 0],
					[0, 1, 0, 0, 0, 0, 0, 0],
					[1, 1, 1, 1, 1, 1, 1, 1]
				]
			}).packet;
			//await serialPortHelper.sendMessage(finalmessage);

			await timer(1000);
			let blast = new PacketConstructor(8, 12, {
				data: [0, 0, 0, 0, 0, 0, 0, 1]
			}).packet;
			//await serialPortHelper.sendMessage(blast);
		};

		let step2 = async () => {
			try {
				let result = await client.exchange.nodeRepository.getAllNodes();

				if (result == null || result.length == 0)
					throw new Error("Empty result!");

				var isc = null,
					ib651_1 = null,
					ib651_2 = null,
					ib651_3 = null;

				result.forEach(x => {
					if (parseInt(x["p.serial"]) == 27 && x["p.typeId"] == 1) isc = x;
					if (parseInt(x["c.serial"]) == 33 && x["c.typeId"] == 2) ib651_1 = x;
					if (parseInt(x["c.serial"]) == 34 && x["c.typeId"] == 2) ib651_2 = x;
					if (parseInt(x["c.serial"]) == 35 && x["c.typeId"] == 2) ib651_3 = x;
				});

				return {
					isc: isc,
					ib651_1: ib651_1,
					ib651_2: ib651_2,
					ib651_3: ib651_3
				};
			} catch (err) {
				return Promise.reject(err);
			}
		};

		let step3 = async result => {
			try {
				//check communication status on each
				expect(result.isc["p.communication_status"]).to.equal(1);
				expect(result.ib651_1["c.communication_status"]).to.equal(1);

				expect(result.ib651_1["c.windowId"]).to.equal(1);
				expect(result.ib651_2["c.communication_status"]).to.equal(1);

				expect(result.ib651_2["c.windowId"]).to.equal(2);
				expect(result.ib651_3["c.communication_status"]).to.equal(1);

				expect(result.ib651_3["c.windowId"]).to.equal(3);
				expect(result.ib651_3["c.communication_status"]).to.equal(1);
			} catch (err) {
				return Promise.reject(err);
			}
		};
		let step2a = async function() {
			try {
				let requestHelper = new RequestHelper();
				let result = await requestHelper.getAll();
				return result;
			} catch (err) {
				return Promise.reject(err);
			}
		};

		let step2b = async function() {
			try {
				let requestHelper = new RequestHelper();
				let result = await requestHelper.getBlastModel();

				return result;
			} catch (err) {
				return Promise.reject(err);
			}
		};

		let test = async () => {
			try {
				await timer(3500);
				await step1();
				await timer(3000);
				let result = await step2();
				console.log(JSON.stringify(await step2a()));
				console.log(JSON.stringify(await step2b()));

				await step3(result);
			} catch (err) {
				return Promise.reject(err);
			}
		};

		return test();
	});

	it("will ignore a data list with no data", async function() {
		let step1 = async () => {
			var initial = "aaaa080300011ae3";

			//await serialPortHelper.sendMessage(initial);
		};

		let step2 = async () => {
			//let results = await databaseHelper.getNodeTreeData(1, 1);
			//return results;
		};

		let test = async () => {
			try {
				await timer(3500);

				await step1();
				await timer(1500);

				let result = await step2();
				expect(result.length).to.equal(0);
			} catch (err) {
				return Promise.reject(err);
			}
		};

		return test();
	});
});
