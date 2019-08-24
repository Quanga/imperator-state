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

xdescribe("HUGE", async function() {
	this.timeout(60000);
	context("four month test", async () => {
		const Happner = require("happner-2");
		const Config = require("../../../config");

		const override = {
			logLevel: "info",
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
		it("can run the whole", async () => {
			try {
				const filedata = fs.readFileSync(path.resolve("/users/timbewsey1/desktop", "packets2.txt"));

				const data = await util.cleanlist(filedata);

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
				fs.writeFileSync(path.resolve(__dirname, "./output.txt"), JSON.stringify(data, null, 2));

				//throw new Error("stop test");
				data.forEach(packet => {
					sendQueue.push({ message: packet, wait: 15 });
				});

				await holdAsync();
				await util.timer(8000);

				let logs = await mesh.exchange.logsRepository.getAll();
				console.log("LOGS", logs.length);

				const logChanges = logs
					.filter(s => s.serial === 39 || s.parentSerial === 39)
					.map(x => {
						return {
							serial: x.serial,
							ip: ipInt(x.serial).toIP(),
							typeId: x.typeId,
							logType: x.logType,
							parentSerial: x.parentSerial,
							windowId: x.windowId,
							modified: moment(x.modified, "x").format("HH:mm:ss.SSSS"),
							counts: x.counts,
							changes: x.changes
						};
					});
				//console.log(JSON.stringify(logChanges, null, 2));
				fs.writeFileSync(
					path.resolve(__dirname, "./39info.txt"),
					JSON.stringify(logChanges, null, 2)
				);
				//test/livedata/data_a/
				//let result3 = await mesh.exchange.dataService.getSnapShot();

				//console.log(JSON.stringify(result3, null, 2));
				console.log("STOPPING");

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
			const convertedback = moment(1565239143000, "x").format("YYYY-MM-DD HH:mm:ss.SSSS");
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
