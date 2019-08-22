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
	this.timeout(60000);
	context("CBB39 file data", async () => {
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
		it("can run the preblast informations", async () => {
			try {
				const filedata = fs.readFileSync(
					path.resolve(
						__dirname,
						"CBB39 - Cullinan 08-08-2019- All events from 3am till 10am copy.txt"
					)
				);

				const data = await compressList(filedata);
				//console.log(data);
				//throw new Error("stop");

				config = new Config(override).configuration;
				mesh = new Happner();

				await mesh.initialize(config);
				//console.log(mesh.data);
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

				expect(mesh._mesh.initialized).to.be.true;
				console.log("INITIALIZED");

				await mesh.start();
				expect(mesh._mesh.started).to.be.true;
				console.log("STARTED");

				console.log("COMPLETE");
				fs.writeFileSync("./39data.txt", JSON.stringify(data, null, 2));

				data.forEach(packet => {
					sendQueue.push({ message: packet, wait: 15 });
				});
				//throw new Error("stop");

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
				fs.writeFileSync("./39info.txt", JSON.stringify(logChanges, null, 2));
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
			//1565226000000
			//const convertedback = moment(converted, "x").format();
			const convertedback = moment(1565239143000, "x").format("YYYY-MM-DD HH:mm:ss.SSSS");
			console.log(convertedback);

			//await timer(2000);
		});

		const compressList = async data => {
			const entries = data.toString();
			const packets = entries.match(/aaaa[0-9,a-f]*/gm);
			const dates = entries.match(/\d*-\d*-\d*\s\d*:\d*:\d*/g);

			var uniqueDates = dates.filter((v, i, a) => a.indexOf(v) === i);

			let results = [];
			//loop through groups of dates now and number them by addind one ms to each one
			uniqueDates.forEach(group => {
				const groupofDates = dates.filter(x => x === group);

				groupofDates.forEach((element, i) => {
					let momentDate = moment(element).format("x");
					let incre = parseInt(momentDate) + i;
					results.push(incre);
				});
			});

			let combined = [];

			packets.forEach((packet, i) => {
				if (combined.length === 0 || combined[combined.length - 1].packet !== packet) {
					combined.push({
						created: results[i],
						packet,
						time: moment(results[i], "x").format("HH:mm:ss.SSSS")
					});
				}
			});

			const filtered = combined.filter(x => x.packet.match(/aaa.{5}0027/g));

			return filtered;
		};

		it("can correctly compress the list", async () => {
			const filedata = fs.readFileSync(
				path.resolve(__dirname, "CBB39 - Cullinan 08-08-2019- All events from 3am till 10am.txt")
			);
			const combinedList = await compressList(filedata);
			console.log(combinedList.length);
			//console.log(JSON.stringify(combinedList, 2, null));
			fs.writeFile("./out.json", JSON.stringify(combinedList, 2, null), (err, res) => {
				if (err) throw new Error(err);
				console.log("done", res);
			});
		});

		it("can convert ip", async () => {
			const ser = 2131232012;
			console.log(ipInt(ser).toIP());
		});
	});
});
