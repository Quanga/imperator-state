/* eslint-disable no-unused-vars */
const chai = require("chai");
const expect = chai.expect;
chai.use(require("chai-match"));
const sinon = require("sinon");
const sinonChai = require("sinon-chai");
chai.use(sinonChai);
const fs = require("fs");
const path = require("path");
var Queue = require("better-queue");
const moment = require("moment");
const util = require("../../helpers/utils");
const ipInt = require("ip-to-int");

//const sandbox = sinon.createSandbox();

describe("LIVE DATA", async function() {
	this.timeout(180000);
	context("Fitch day", async () => {
		const Happner = require("happner-2");
		const Config = require("../../../config");

		const override = {
			logLevel: "info",
			mode: "AXXIS100_CFC",
			name: "edge_state",
			db: "./edge.db",
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
		let mesh, config;

		const sendQueue = new Queue((task, cb) => {
			setTimeout(async () => {
				mesh.exchange.queueService.processIncoming(task.message).then(() => cb());
			}, task.wait);
		});

		const holdAsync = () =>
			new Promise(resolve => {
				sendQueue.on("drain", () => {
					return resolve();
				});
			});

		const removeDbItems = async mesh => {
			const paths = ["nodes", "logs", "packetLog"];
			for (const pth of paths) {
				await new Promise((resolve, reject) => {
					mesh.exchange.data.remove(`persist/${pth}/*`, null, (e, result) => {
						if (e) {
							return reject(e);
						}
						console.log(result);
						resolve(result);
					});
				});
			}
		};

		it("can run day 25", async () => {
			try {
				const filedata = fs.readFileSync(path.resolve(__dirname, "./data.txt"));

				const data = await util.compressList(filedata);

				config = new Config(override).configuration;
				mesh = new Happner();

				await mesh.initialize(config);
				await removeDbItems(mesh);

				expect(mesh._mesh.initialized).to.be.true;
				console.log("INITIALIZED");

				await mesh.start();
				expect(mesh._mesh.started).to.be.true;
				console.log("STARTED");

				console.log("COMPLETE");
				//fs.writeFileSync(path.resolve(__dirname, "./39data.txt"), JSON.stringify(data, null, 2));

				data.forEach(packet => {
					sendQueue.push({ message: packet, wait: 15 });
				});

				await holdAsync();
				await util.timer(8000);

				let logs = await mesh.exchange.logsRepository.get("*");
				console.log("LOGS", logs.length);

				const logChanges = logs.map(x => {
					return {
						serial: x.serial,
						typeId: x.typeId,
						logType: x.logType,
						created: moment(x.createdAt, "x").format("HH:mm:ss.SSSS"),
						events: x.events
					};
				});
				fs.writeFileSync(
					path.resolve(__dirname, "./fitchday.txt"),
					JSON.stringify(logChanges, null, 2)
				);

				console.log("STOPPING");

				await mesh.stop();
				expect(mesh._mesh.stopped).to.be.true;
			} catch (err) {
				console.log(err);
				throw new Error(err);
			}
		});

		it("can run day 26", async () => {
			try {
				const filedata = fs.readFileSync(path.resolve(__dirname, "./day26.txt"));

				const data = await util.compressList(filedata);

				config = new Config(override).configuration;
				mesh = new Happner();

				await mesh.initialize(config);
				await removeDbItems(mesh);

				expect(mesh._mesh.initialized).to.be.true;
				console.log("INITIALIZED");

				await mesh.start();
				expect(mesh._mesh.started).to.be.true;
				console.log("STARTED");

				console.log("COMPLETE");
				//fs.writeFileSync(path.resolve(__dirname, "./39data.txt"), JSON.stringify(data, null, 2));

				data.forEach(packet => {
					sendQueue.push({ message: packet, wait: 15 });
				});

				await holdAsync();
				await util.timer(8000);

				let logs = await mesh.exchange.logsRepository.get("*");
				console.log("LOGS", logs.length);

				const logChanges = logs.map(x => {
					return {
						serial: x.serial,
						typeId: x.typeId,
						logType: x.logType,
						created: moment(x.createdAt, "x").format("HH:mm:ss.SSSS"),
						events: x.events
					};
				});
				fs.writeFileSync(
					path.resolve(__dirname, "./fitchday26.txt"),
					JSON.stringify(logChanges, null, 2)
				);

				console.log("STOPPING");

				await mesh.stop();
				expect(mesh._mesh.stopped).to.be.true;
			} catch (err) {
				console.log(err);
				throw new Error(err);
			}
		});

		it("can run day 28", async () => {
			try {
				const filedata = fs.readFileSync(path.resolve(__dirname, "./fitch28.txt"));

				const data = await util.compressList(filedata);

				config = new Config(override).configuration;
				mesh = new Happner();

				await mesh.initialize(config);
				await removeDbItems(mesh);

				expect(mesh._mesh.initialized).to.be.true;
				console.log("INITIALIZED");

				await mesh.start();
				expect(mesh._mesh.started).to.be.true;
				console.log("STARTED");

				console.log("COMPLETE");
				//fs.writeFileSync(path.resolve(__dirname, "./39data.txt"), JSON.stringify(data, null, 2));

				data.forEach(packet => {
					sendQueue.push({ message: packet, wait: 15 });
				});

				await holdAsync();
				await util.timer(8000);

				let logs = await mesh.exchange.logsRepository.get("*");
				console.log("LOGS", logs.length);

				const logChanges = logs.map(x => {
					return {
						serial: x.serial,
						typeId: x.typeId,
						logType: x.logType,
						created: moment(x.createdAt, "x").format("HH:mm:ss.SSSS"),
						events: x.events
					};
				});
				fs.writeFileSync(
					path.resolve(__dirname, "./fitchday28.txt"),
					JSON.stringify(logChanges, null, 2)
				);

				console.log("STOPPING");
				let errpackets = await mesh.exchange.eventService.getPacketError("*");
				console.log(JSON.stringify(errpackets));

				await mesh.stop();
				expect(mesh._mesh.stopped).to.be.true;
			} catch (err) {
				console.log(err);
				throw new Error(err);
			}
		});

		it("can correctly change a date to timestamp", async () => {
			const datestring = "2019-08-08 03:59:44";
			const converted = moment(datestring).format("x");
			expect(moment(datestring).isValid()).to.be.true;
			console.log(converted);
			//1566828261000
			//const convertedback = moment(1565239143000, "x").format("YYYY-MM-DD HH:mm:ss.SSSS");
			const convertedback = moment(1566828261000, "x").format("YYYY-MM-DD HH:mm:ss.SSSS");
			console.log(convertedback);
		});

		it("can correctly compress the list", async () => {
			const filedata = fs.readFileSync(
				path.resolve(__dirname, "CBB39 - Cullinan 08-08-2019- All events from 3am till 10am.txt")
			);

			const combinedList = await util.compressList(filedata, "0027");
			console.log(combinedList.length);
			fs.writeFile(
				path.resolve(__dirname, "./out.json"),
				JSON.stringify(combinedList, 2, null),
				err => {
					if (err) throw new Error(err);
					console.log("done");
				}
			);
		});

		xit("can convert ip", async () => {
			const ser = 459677282;
			console.log(ipInt(ser).toIP());
		});
	});
});
