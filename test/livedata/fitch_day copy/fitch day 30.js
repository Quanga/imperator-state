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
	this.timeout(580000);
	context("Fitch day 30", async () => {
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
			const paths = ["nodes", "logs", "packetLog", "warnings"];
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

		it("can run day 30 to create all allLogs.txt", async () => {
			try {
				const filedata = fs.readFileSync(path.resolve(__dirname, "./day30.txt"));

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

				data.forEach(packet => {
					sendQueue.push({ message: packet, wait: 5 });
				});

				await holdAsync();
				await util.timer(8000);

				let logs = await mesh.exchange.logsRepository.get("*");

				fs.writeFileSync(path.resolve(__dirname, `./allLogs.txt`), JSON.stringify(logs, null, 2));

				let warnings = await mesh.exchange.warningsRepository.get("*");
				const warningsProcessed = warnings.map(w => {
					const { _meta, ...noMeta } = w;
					noMeta.createdTime = moment(w.createdAt, "x").format("HH:mm:ss.SSSS");
					return noMeta;
				});
				console.log("WARNINGS", warnings.length);

				fs.writeFileSync(
					path.resolve(__dirname, `./fitchday30_warnings.txt`),
					JSON.stringify(warningsProcessed, null, 2)
				);

				console.log("STOPPING");
				let errpackets = await mesh.exchange.eventService.getPacketError("*");
				const errorProcessed = errpackets.map(w => {
					const { _meta, ...noMeta } = w;
					noMeta.createdTime = moment(w.createdAt, "x").format("HH:mm:ss.SSSS");
					return noMeta;
				});

				fs.writeFileSync(
					path.resolve(__dirname, "./fitcherrors30.txt"),
					JSON.stringify(errorProcessed, null, 2)
				);

				await mesh.stop();
				expect(mesh._mesh.stopped).to.be.true;
			} catch (err) {
				console.log(err);
				throw new Error(err);
			}
		});

		xit("can extract the CBB data from the Logs", async () => {
			const logs = fs.readFileSync(path.resolve(__dirname, "./allLogs.txt"));

			const parsedLogs = JSON.parse(logs);
			const CCB = [...new Set(parsedLogs.filter(t => t.typeId === 0).map(p => p.serial))];

			CCB.forEach((ser, i) => {
				const logChanges = parsedLogs
					.filter(
						x =>
							parseInt(x.serial, 10) === ser &&
							x.typeId === 0 &&
							x.events[0].diff.hasOwnProperty("fireButton") &&
							x.events[0].diff.fireButton === 1
					)
					.map(x => {
						return {
							serial: x.serial,
							type: "background",
							typeId: x.typeId,
							content: "FIRING",
							className: "firing",
							start: moment(x.createdAt, "x").format(),
							end: moment(x.createdAt + 120000, "x").format(),
							events: x.events
						};
					});
				fs.writeFileSync(
					path.resolve(__dirname, `./fitchday30_ccb${ser}.txt`),
					JSON.stringify(logChanges, null, 2)
				);
			});
		});

		it("can extract the CBBs from the log file", async () => {
			const logs = fs.readFileSync(path.resolve(__dirname, "./allLogs.txt"));

			const parsedLogs = JSON.parse(logs);
			const CBBKeys = [...new Set(parsedLogs.filter(t => t.typeId === 3).map(p => p.serial))];

			let allUnitUpdates = [];
			const CBBData = parsedLogs.filter(x => x.typeId === 3);

			CBBData.forEach(item => {
				//console.log(item);
				if (
					item.logType === "UNIT_UPDATE" ||
					item.logType === "UNIT_UPDATE" ||
					item.logType === "DET_INSERT" ||
					item.logType === "EDD_SIG"
				) {
					if (item.hasOwnProperty("events")) {
						const event = item.events[0];
						if (event.diff) {
							const allDiffs = Object.keys(event.diff);

							allDiffs.forEach(diff => {
								let out = {
									serial: item.serial,
									typeId: 3,
									log: diff,
									value: event.diff[diff],
									createdAt: item.createdAt
								};
								allUnitUpdates.push(out);
							});
						}
					}
				}
			});
			//console.log(allUnitUpdates);

			let processedUnitUpdates = [];
			allUnitUpdates.forEach(logItem => {
				let obj = {
					serial: logItem.serial,
					group: `${logItem.typeId}/${logItem.serial}/${logItem.log}`,
					content: logItem.log,
					className: logItem.value === 1 ? "on" : "off",
					type: "point",
					start: moment(logItem.createdAt, "x").format()
				};

				switch (logItem.log) {
				case "childCount":
					obj.content = logItem.value;
					break;
				case "ledState":
					obj.content = logItem.value;
					break;
				default:
					obj.content = "";
					break;
				}
				processedUnitUpdates.push(obj);
			});
			//console.log(processedUnitUpdates);

			let allDetInserts = [];
			CBBData.forEach(item => {
				//console.log(item);
				if (item.logType === "DET_INSERT") {
					let out = {
						serial: item.serial,
						typeId: 3,
						log: "detInsert",
						value: item.events.length,
						createdAt: item.createdAt
					};
					allDetInserts.push(out);
				}
			});

			//let processDetInserts = [];
			allDetInserts.forEach(logItem => {
				let obj = {
					serial: logItem.serial,
					group: `${logItem.typeId}/${logItem.serial}/${logItem.log}`,
					content: logItem.value,
					className: "added",
					type: "point",
					start: moment(logItem.createdAt, "x").format()
				};

				processedUnitUpdates.push(obj);
			});

			let allDetUpdates = [];
			CBBData.forEach(item => {
				//console.log(item);
				if (item.logType === "DET_UPDATE") {
					let out = {
						serial: item.serial,
						typeId: 3,
						log: "detInsert",
						value: item.events.length,
						createdAt: item.createdAt
					};
					allDetUpdates.push(out);
				}
			});

			allDetUpdates.forEach(logItem => {
				let obj = {
					serial: logItem.serial,
					group: `${logItem.typeId}/${logItem.serial}/${logItem.log}`,
					content: logItem.value,
					className: "updated",
					type: "point",
					start: moment(logItem.createdAt, "x").format()
				};

				processedUnitUpdates.push(obj);
			});

			let allEDDSig = [];
			CBBData.forEach(item => {
				//console.log(item);
				if (item.logType === "EDD_SIG") {
					let out = {
						serial: item.serial,
						typeId: 3,
						log: "detInsert",
						createdAt: item.createdAt
					};
					allEDDSig.push(out);
				}
			});

			allEDDSig.forEach(logItem => {
				let obj = {
					serial: logItem.serial,
					group: `${logItem.typeId}/${logItem.serial}/${logItem.log}`,
					content: "sig",
					className: "eddsig",
					type: "background",
					start: moment(logItem.createdAt, "x").format(),
					end: moment(logItem.createdAt + 1000, "x").format()
				};

				processedUnitUpdates.push(obj);
			});

			const errors = fs.readFileSync(path.resolve(__dirname, "./fitcherrors30.txt"));

			const parsedErrors = JSON.parse(errors);

			parsedErrors.forEach(logItem => {
				let obj = {
					group: `ERR`,
					content: "ERR",
					className: "err",
					type: "point",
					start: moment(logItem.createdAt, "x").format()
				};

				processedUnitUpdates.push(obj);
			});

			fs.writeFileSync(
				path.resolve(__dirname, `./CBBs.txt`),
				JSON.stringify(processedUnitUpdates, null, 2)
			);

			await util.timer(2000);
		});

		it("can extract 77 data from a snapshot", async () => {
			const snap = fs.readFileSync(path.resolve(__dirname, "./snapshot.json"));

			const parsedSnap = JSON.parse(snap);
			const units = parsedSnap.units["77"].children;

			const childWindowKeys = Object.keys(units);

			let result = childWindowKeys.map(u => {
				return {
					window: units[u].data.windowId,
					serial: ipInt(units[u].data.serial).toIP(),
					detonatorStatus: units[u].data.detonatorStatus,
					delay: units[u].data.delay
				};
			});
			fs.writeFileSync(path.resolve(__dirname, `./snap77_1.txt`), JSON.stringify(result, null, 2));

			const snap2 = fs.readFileSync(path.resolve(__dirname, "./snapshot2.json"));

			const parsedSnap2 = JSON.parse(snap2);
			const units2 = parsedSnap2.units["77"].children;

			const childWindowKeys2 = Object.keys(units2);

			let result2 = childWindowKeys2.map(u => {
				return {
					window: units2[u].data.windowId,
					serial: ipInt(units2[u].data.serial).toIP(),
					detonatorStatus: units2[u].data.detonatorStatus,
					delay: units2[u].data.delay
				};
			});

			fs.writeFileSync(path.resolve(__dirname, `./snap77_2.txt`), JSON.stringify(result2, null, 2));
		});

		it("can write all the CFCs for one file from all Logs", async () => {
			const logs = JSON.parse(fs.readFileSync(path.resolve(__dirname, "./allLogs.txt")));

			const cfcKeys = [...new Set(logs.filter(t => t.typeId === 5).map(p => p.serial))];

			const allCFCs = [];
			cfcKeys.forEach((cfcKey, i) => {
				const logChanges = logs.filter(x => parseInt(x.serial, 10) === cfcKey && x.typeId === 5);

				logChanges.forEach(x => {
					console.log(x);

					let obj = {
						serial: x.serial,
						group: `${x.typeId}/${x.serial}/${x.logType}`,
						typeId: x.typeId,
						content: x.events ? x.events[0].diff.qos : 0,
						type: "point",
						className: "cfc",
						start: moment(x.createdAt, "x").format()
					};

					allCFCs.push(obj);
				});
			});

			fs.writeFileSync(path.resolve(__dirname, `./CFC.txt`), JSON.stringify(allCFCs, null, 2));
		});
	});
});

/*
.map(x => {
						let obj = {
							serial: x.serial,
							group: `${x.typeId}/${x.serial}/${x.logType}`,
							typeId: x.typeId,
							content: x.logType,
							type: "point",
							start: moment(x.createdAt, "x").format(),
							events: x.events
						};

						switch (x.logType) {
						case "EDD_SIG":
							obj.group = `${x.typeId}/${x.serial}/UNIT_UPDATE`;
							obj.end = moment(x.createdAt + 2000, "x").format();
							obj.className = "eddsig";
							break;

						case "UNIT_UPDATE":
							{
								if (x.events[0].diff.hasOwnProperty("keySwitchStatus")) {
									if (x.events[0].diff.keySwitchStatus === 1) {
										obj.group = `${x.typeId}/${x.serial}/ARMING`;
										obj.content = "ARMED";
										obj.className = "armed";
									} else {
										obj.group = `${x.typeId}/${x.serial}/ARMING`;

										obj.content = "DISARMED";
										obj.className = "disarmed";
									}
								}
							}
							break;
						}*/
