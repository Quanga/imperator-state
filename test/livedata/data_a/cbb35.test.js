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
	this.timeout(30000);
	context("CBB35 file data", async function() {
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
			setTimeout(() => {
				mesh.exchange.queueService.processIncoming(task.message);
				cb();
			}, task.wait);
		});

		const holdAsync = () =>
			new Promise(resolve => {
				sendQueue.on("drain", () => {
					return resolve();
				});
			});

		it("can run the preblast information for 35", async () => {
			try {
				const filedata = fs.readFileSync(
					path.resolve(__dirname, "CBB35 - Cullinan 31-07-2018- Det Id incoming packets.txt")
				);
				console.log(filedata);

				config = new Config(override).configuration;
				mesh = new Happner();

				await mesh.initialize(config);

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
				const preData = await compressList(filedata);
				console.log("PRE", preData);

				console.log("COMPLETE");
				preData.forEach(packet => {
					sendQueue.push({ message: packet, wait: 10 });
				});

				await holdAsync();
				await util.timer(2000);

				let result = await mesh.exchange.dataService.getSnapShot();
				//console.log(;
				await new Promise((resolve, reject) => {
					fs.writeFile("preblast.txt", JSON.stringify(result, null, 2), {}, (err, resp) => {
						if (err) return reject(err);
						resolve(resp);
					});
				});

				const preblast2 = fs.readFileSync(
					path.resolve(__dirname, "CBB35 - Cullinan 31-07-2018- PreBlast det status.txt")
				);

				const data2 = await compressList(preblast2);
				if (!data2 || !data2.length > 0) throw new Error("returned list is empty");

				data2.forEach(packet => {
					sendQueue.push({ message: packet, wait: 10 });
				});
				console.log("PREBLAST COMPLETE");
				await holdAsync();
				await util.timer(2000);

				let resultPre = await mesh.exchange.dataService.getSnapShot();

				const dets = Object.keys(resultPre.units[35].children);

				let dets2 = dets.map((x, i) => {
					return {
						windowId: resultPre.units[35].children[x].data.windowId,
						serial: resultPre.units[35].children[x].data.serial,
						ip: ipInt(resultPre.units[35].children[x].data.serial).toIP(),
						created: moment(resultPre.units[35].children[x].data.created),
						delay: resultPre.units[35].children[x].data.delay,
						logged: resultPre.units[35].children[x].data.logged
					};
				});
				//console.log(;
				await new Promise((resolve, reject) => {
					fs.writeFile(
						"preblastwithdata.txt",
						JSON.stringify(resultPre, null, 2),
						{},
						(err, resp) => {
							if (err) return reject(err);
							resolve(resp);
						}
					);
				});

				await new Promise((resolve, reject) => {
					fs.writeFile("processed.txt", JSON.stringify(dets2, null, 2), {}, (err, resp) => {
						if (err) return reject(err);
						resolve(resp);
					});
				});

				const preblast3 = fs.readFileSync(
					path.resolve(__dirname, "CBB35 - Cullinan 31-07-2018- Post Blast det status.txt")
				);

				const packets3 = await compressList(preblast3);

				packets3.forEach(packet => {
					sendQueue.push({ message: packet, wait: 10 });
				});
				await holdAsync();
				await util.timer(2000);

				const ccbblast = fs.readFileSync(path.resolve(__dirname, "CCB_INFO.txt"));

				const ccbblast2 = await compressList(ccbblast);

				ccbblast2.forEach(packet => {
					sendQueue.push({ message: packet, wait: 10 });
				});
				await holdAsync();
				await util.timer(2000);

				let result3 = await mesh.exchange.dataService.getSnapShot();

				//console.log(;
				await new Promise((resolve, reject) => {
					fs.writeFile("postBlast.txt", JSON.stringify(result3, null, 2), {}, (err, resp) => {
						if (err) return reject(err);
						resolve(resp);
					});
				});
				await util.timer(5000);

				let logs = await mesh.exchange.logsRepository.getAll();
				console.log("LOGS", logs.length);

				const logChanges = logs
					.filter(s => s.serial === 35 || s.parentSerial === 35 || s.serial === 7)
					.map(x => {
						return {
							serial: x.serial,
							typeId: x.typeId,
							logType: x.logType,
							parentSerial: x.parentSerial,
							windowId: x.windowId,
							modified: moment(x.modified, "x").format("HH:mm:ss.SSSS"),
							counts: x.counts,
							changes: x.changes
						};
					});

				fs.writeFileSync("./35info.txt", JSON.stringify(logChanges, null, 2));

				console.log("STOPPING");
				await mesh.stop();
				expect(mesh._mesh.stopped).to.be.true;
			} catch (err) {
				console.log(err);
				throw new Error(err);
			}
		});

		const compressList = async data => {
			try {
				const entries = data.toString();
				const packets = entries.match(/aaaa[0-9,a-f]*/gm);
				const dates = entries.match(/\d*-\d*-\d*\s\d*:\d*:\d*/g);

				const uniqueDates = dates.filter((v, i, a) => a.indexOf(v) === i);

				let results = [];
				//loop through groups of dates now and number them by addind one ms to each one
				uniqueDates.forEach(group => {
					const groupofDates = dates.filter(x => x === group);

					groupofDates.forEach((element, i) => {
						let momentDate = moment(element).format("x");
						let incre = parseInt(momentDate);
						results.push((incre += i));
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

				const filtered = combined.filter(x => x.packet.match(/aaa.{5}0023/g));

				return filtered;
			} catch (err) {
				console.log(err);
			}
		};
	});
});
