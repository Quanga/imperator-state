// eslint-disable-next-line no-unused-vars
const chai = require("chai");
const expect = chai.expect;
chai.use(require("chai-match"));
const sinon = require("sinon");
const sinonChai = require("sinon-chai");
chai.use(sinonChai);
const fs = require("fs");
const path = require("path");
var Queue = require("better-queue");

//const sandbox = sinon.createSandbox();

const timer = ms =>
	new Promise(resolve => {
		setTimeout(() => {
			resolve();
		}, ms);
	});

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

		const incomingQueue = new Queue((input, cb) => {
			mesh.exchange.queueService.processIncoming(input).then((err, res) => {
				if (err) console.error("cannot process queue", err);
				cb(null, res);
			});
		});

		const holdAsync = () =>
			new Promise(resolve => {
				incomingQueue.on("drain", () => {
					return resolve();
				});
			});
		it("can run the preblast information", async () => {
			try {
				const preblast = fs.readFileSync(
					path.resolve(__dirname, "CBB35 - Cullinan 31-07-2018- Det Id incoming packets.txt")
				);
				config = new Config(override).configuration;
				mesh = new Happner();

				await mesh.initialize(config);
				console.log(mesh.data);
				await new Promise((resolve, reject) => {
					mesh.exchange.data.remove(`persist/nodes/*`, null, (e, result) => {
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
				const entries = preblast.toString();
				const reg = /aaaa[0-9,a-f]*/gm;
				const packets = entries.match(reg);

				packets.forEach(packet => {
					incomingQueue.push({ created: Date.now(), packet });
				});

				await holdAsync();
				await timer(2000);

				// let result = await mesh.exchange.dataService.getSnapShot();

				// const preblast2 = fs.readFileSync(
				// 	path.resolve(__dirname, "CBB35 - Cullinan 31-07-2018- PreBlast det status.txt")
				// );

				// const entries2 = preblast2.toString();
				// const reg2 = /aaaa[0-9,a-f]*/gm;
				// const packets2 = entries2.match(reg2);

				// packets2.forEach(packet => {
				// 	incomingQueue.push({ created: Date.now(), packet });
				// });
				// await holdAsync();
				// await timer(2000);

				// const preblast3 = fs.readFileSync(
				// 	path.resolve(__dirname, "CBB35 - Cullinan 31-07-2018- Post Blast det status.txt")
				// );

				// const entries3 = preblast3.toString();
				// const reg3 = /aaaa[0-9,a-f]*/gm;
				// const packets3 = entries3.match(reg3);

				// packets3.forEach(packet => {
				// 	incomingQueue.push({ created: Date.now(), packet });
				// });
				// await holdAsync();
				// await timer(2000);

				//test/livedata/data_a/
				let result3 = await mesh.exchange.dataService.getSnapShot();

				console.log(JSON.stringify(result3, null, 2));
				console.log("STOPPING");
				await mesh.stop();
				expect(mesh._mesh.stopped).to.be.true;
			} catch (err) {
				console.log(err);
				throw new Error(err);
			}
		});
	});
});
