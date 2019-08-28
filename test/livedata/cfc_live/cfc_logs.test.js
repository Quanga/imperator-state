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
const ipInt = require("ip-to-int");
const util = require("../../helpers/utils");

//const sandbox = sinon.createSandbox();

describe("LIVE DATA", async function() {
	this.timeout(30000);
	context("CFC", async function() {
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
			setTimeout(() => {
				mesh.exchange.queueService.processIncoming(task.message);
				cb();
			}, task.wait);
		});

		const removeDbItems = async mesh => {
			await new Promise((resolve, reject) => {
				mesh.exchange.data.remove(`persist/nodes/*`, null, (e, result) => {
					if (e) {
						return reject(e);
					}
					console.log(result);
					resolve(result);
				});
			});
			await new Promise((resolve, reject) => {
				mesh.exchange.data.remove(`persist/logs/*`, null, (e, result) => {
					if (e) {
						return reject(e);
					}
					console.log(result);
					resolve(result);
				});
			});
		};
		it("can run a list of cfcs through the system", async () => {
			const filedata = fs.readFileSync(path.resolve(__dirname, "data.txt"));
			const entries = filedata.toString().split("\r\n");
			const res = [];

			entries.forEach(e => {
				const ent = e.split(";");
				const e2 = ent[0].match(/aaaa\w*/g);

				res.push({
					packet: e2[0],
					createdAt: moment(ent[1]).format("x")
				});
			});

			await util.timer(1000);
			// console.log(res);
			// throw new Error();

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
			res.forEach(packet => {
				sendQueue.push({ message: packet, wait: 10 });
			});

			await util.holdTillDrained(sendQueue);
			await util.timer(2000);

			let logs = await mesh.exchange.logsRepository.get("*");
			console.log("LOGS", logs.length);

			const logChanges = logs.map(x => {
				return {
					serial: x.serial,
					typeId: x.typeId,
					logType: x.logType,
					created: x.createdAt,
					events: x.events
				};
			});

			fs.writeFileSync(path.resolve(__dirname, "./cfc.txt"), JSON.stringify(logChanges, null, 2));

			console.log("STOPPING");
			await mesh.stop();
			expect(mesh._mesh.stopped).to.be.true;
		});

		it("can extract distinct values from the data", async () => {
			const filedata = fs.readFileSync(path.resolve(__dirname, "cfc.txt"));
			const data = JSON.parse(filedata.toString());
			//console.log(data);

			const serialKeys = data.map(x => x.serial).filter((x, i, a) => a.indexOf(x) === i);
			console.log(serialKeys);

			serialKeys.forEach(srl => {
				const qos = data
					.filter(d => d.hasOwnProperty("events") && d.serial === srl)
					.map(x => {
						return {
							x: parseInt(x.created),
							y: x.events[0].diff.qos
						};
					});
				fs.writeFileSync(path.resolve(__dirname, `./${srl}_qos.txt`), JSON.stringify(qos, null, 2));
			});
			// const qos = logs
			// 	.filter(d => d.hasOwnProperty("events"))
			// 	.map(x => {
			// 		return {
			// 			serial: x.serial,
			// 			created: moment(x.createdAt, "x").format("HH:mm:ss.SSSS"),
			// 			qos: x.events[0].diff.qos
			// 		};
			// 	});

			// fs.writeFileSync(path.resolve(__dirname, "./qos.txt"), JSON.stringify(qos, null, 2));
		});
	});
});
