// eslint-disable-next-line no-unused-vars
const expect = require("expect.js");
const DatabaseHelper = require("../helpers/database_helper");
const ServerHelper = require("../helpers/server_helper");
const SerialPortHelper = require("../helpers/serial_port_helper");
const PacketConstructor = require("../../lib/builders/packetConstructor");
const request = require("supertest");

require("dotenv").config();

describe("Integrated Blast Event Tests", async function() {
	let serverHelper = new ServerHelper();
	const databaseHelper = new DatabaseHelper();
	const serialPortHelper = new SerialPortHelper();

	this.timeout(30000);

	beforeEach("cleaning up db and start server", async function() {
		try {
			await databaseHelper.initialise();
			await databaseHelper.clearDatabase();
			await serialPortHelper.initialise();
			serverHelper = new ServerHelper();
			await serverHelper.startServer();
		} catch (err) {
			return Promise.reject(err);
		}
	});

	afterEach("stop test server", async function() {
		await serverHelper.stopServer();
		await timer(3000);
	});

	let timer = ms => {
		return new Promise(resolve => setTimeout(resolve, ms));
	};

	it.only("can start a blast event", async function() {
		//start the blast event
		let setupControlUnit = async function() {
			const data1 = {
				data: [0, 0, 0, 0, 0, 0, 0, 0]
			};

			let initial = new PacketConstructor(8, 8, data1);
			await serialPortHelper.sendMessage(initial.packet);

			await timer(2000);
			const data2 = { data: [] };
			const message = new PacketConstructor(4, 12, data2);
			await serialPortHelper.sendMessage(message.packet);

			await timer(3000);
			const data3 = {
				data: [
					{
						serial: 12,
						windowId: 2,
						ledState: 6,
						rawData: [0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1]
					}
				]
			};
			const message2 = new PacketConstructor(5, 12, data3);
			await serialPortHelper.sendMessage(message2.packet);
		};
		let response;

		let checkDataModel = async () => {
			try {
				request(`http://localhost:${process.env.HAPPNER_LOCAL_PORT}`)
					.get("/rest/method/eventService/getModelStructure")
					.then(res => {
						//response = res.body.data;
						//console.log(typeof res);
						let body = res.body.data;
						response = body.map(item => {
							return item.data;
						});
					});
			} catch (err) {
				return Promise.reject(err);
			}
		};
		let blastModel;

		let checkBlastModel = async () => {
			try {
				request(`http://localhost:${process.env.HAPPNER_LOCAL_PORT}`)
					.get("/rest/method/eventService/getBlastModel")
					.then(res => {
						blastModel = res.body.data;
						// blastModel = body.map(item => {
						// 	return item.data;
						// });
					});
			} catch (err) {
				return Promise.reject(err);
			}
		};

		let test = async () => {
			try {
				await timer(4000);
				await setupControlUnit();
				await timer(3000);

				await checkDataModel();
				await checkBlastModel();
				await timer(4000);
				console.log(response);
				console.log(blastModel);
			} catch (err) {
				return Promise.reject(err);
			}
		};

		return test();
	});
});