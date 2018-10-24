const expect = require("expect.js");
//const async = require("async");

describe("0x08-IBC-data-request-test", async function() {
	require("dotenv").config({
		path: "./.env"
	});

	var ServerHelper = require("../helpers/server_helper");
	var serverHelper = new ServerHelper();

	var DatabaseHelper = require("../helpers/database_helper");
	var databaseHelper = new DatabaseHelper();

	var FileHelper = require("../helpers/file_helper");
	var fileHelper = new FileHelper();

	var SerialPortHelper = require("../helpers/serial_port_helper");
	var serialPortHelper = new SerialPortHelper();

	this.timeout(25000);

	before("cleaning up queues", async function() {
		await fileHelper.clearQueueFiles();
	});

	before("start test server", async function() {
		let server = await serverHelper.startServer();
		return server;
	});

	before("cleaning up db", async function() {
		await databaseHelper.clearDatabase();
	});

	after("stop test server", async function() {
		await serverHelper.stopServer();
	});

	// it("can send a key switch disarmed on IBC 8", function(done) {
	// 	let timeout = ms => {
	// 		return new Promise(resolve => setTimeout(resolve, ms));
	// 	};

	// 	let SendMessage = async () => {
	// 		const PacketBuilder = require("../../lib/builders/packet_builder");
	// 		let packetBuilder = new PacketBuilder();
	// 		const StringBuilder = require("../../lib/builders/string_builder");
	// 		let stringBuilder = new StringBuilder();

	// 		try {
	// 			let deviceId = packetBuilder.createDeviceIdData(8);
	// 			let deviceType = packetBuilder.createDeviceTypeData(0);
	// 			let rawData = packetBuilder.createRawData([0, 0, 0, 0, 0, 0, 1, 0]); // key switch disarmed, isolation relay on

	// 			let deviceData = stringBuilder
	// 				.append(deviceId)
	// 				.to(deviceType)
	// 				.and(rawData)
	// 				.complete();

	// 			var message = packetBuilder
	// 				.withStart("AAAA")
	// 				.withCommand(8) // the command we're testing - 0x08
	// 				.withSerial(8) // IBC serial 8
	// 				.withDeviceData(deviceData)
	// 				.build();
	// 			await serialPortHelper.sendMessage(message);
	// 		} catch (err) {
	// 			console.log("err message", err);
	// 		}
	// 	};

	// 	let checkDatabase = async () => {
	// 		try {
	// 			//await timeout(3000);
	// 			let result = await databaseHelper.getNodeTreeData(8, 0);

	// 			if (result == null || result.length == 0)
	// 				return new Error("Empty result!");

	// 			//console.log("results " + JSON.stringify(result));
	// 			var ibc = result[0];
	// 			return {
	// 				ibc: ibc
	// 			};
	// 		} catch (err) {
	// 			console.log(err);
	// 		}
	// 	};

	// 	let checkResults = async result => {
	// 		try {
	// 			expect(result.ibc["p.communication_status"]).to.equal(1);
	// 			expect(result.ibc["p.fire_button"]).to.equal(0);
	// 			expect(result.ibc["p.key_switch_status"]).to.equal(0);
	// 			expect(result.ibc["p.isolation_relay"]).to.equal(1);
	// 			console.log("result correct");
	// 		} catch (err) {
	// 			console.log(err);
	// 		}
	// 	};

	// 	serverHelper
	// 		.startServer()
	// 		.then(() => timeout(5000))
	// 		.then(() => SendMessage())
	// 		.then(() => {
	// 			return checkDatabase();
	// 		})
	// 		.then(results => {
	// 			() => checkResults(results);
	// 		})
	// 		.then(() => done())
	// 		.catch(err => {
	// 			done(err);

	// 			console.log("error" + err);
	// 		});
	// });

	it.only("can send a key switch armed on IBC 8 where previous state was disarmed", async function() {
		let timer = ms => {
			return new Promise(resolve => setTimeout(resolve, ms));
		};

		let checkDatabase = async function() {
			try {
				console.log("Checking database --------------------------");
				let result = await databaseHelper.getNodeTreeData(8, 0);

				if (result == null || result.length == 0) {
					return new Error("Empty result!");
				}

				let ibc = result[0];
				return {
					ibc: ibc
				};
			} catch (err) {
				return Promise.reject(err);
			}
		};

		let checkResults = async function(result) {
			try {
				expect(result.ibc["p.communication_status"]).to.equal(1);
				expect(result.ibc["p.fire_button"]).to.equal(0);
				expect(result.ibc["p.key_switch_status"]).to.equal(1);
				expect(result.ibc["p.isolation_relay"]).to.equal(1);
			} catch (err) {
				return Promise.reject(err);
			}
		};

		let startTest = async function() {
			try {
				console.log("STARTING TESTS<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<");
				await timer(4500);
				await SendMessage({
					from: 1,
					serial: 8,
					type: 0,
					data: [0, 0, 0, 0, 0, 0, 1, 0]
				});
				console.log("SEND MESSAGE 1 <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<");

				await timer(200);
				await SendMessage({
					form: 2,
					serial: 8,
					type: 0,
					data: [0, 0, 0, 0, 0, 0, 1, 1]
				});
				console.log("SEND MESSAGE 2 <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<");

				await timer(1000);

				await SendMessage({
					from: 3,
					serial: 8,
					type: 0,
					data: [0, 0, 0, 0, 0, 0, 1, 1]
				});
				console.log("SEND MESSAGE 3 <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<");
				await timer(4000);

				let results = await checkDatabase();
				let ass = await checkResults(results);
				return ass;
			} catch (err) {
				return Promise.reject(err);
			}
		};

		await startTest();
	});

	let SendMessage = async function(input) {
		let PacketBuilder = require("../../lib/builders/packet_builder");
		let StringBuilder = require("../../lib/builders/string_builder");
		let packetBuilder = new PacketBuilder();
		let stringBuilder = new StringBuilder();

		/* TEST: AAAA 0A 08 0008 08C0 (CRC)
			 start - AAAA
			 length - 0A
			 command - 08
			 serial - 0008
			 data - 08C0 (FIRST BYTE (DEVICE ID & TYPE) - 08 - IGNORED; second byte - C0 - switch armed and isolation relay on)
			 crc - ?
			 */

		try {
			packetBuilder.reset();
			//data
			let deviceId = packetBuilder.createDeviceIdData(input.serial);
			let deviceType = packetBuilder.createDeviceTypeData(input.type);
			let rawData = packetBuilder.createRawData(input.data); // key switch armed, isolation relay on

			let deviceData = stringBuilder
				.append(deviceId)
				.to(deviceType)
				.and(rawData)
				.complete();

			//complete packet
			let message = packetBuilder
				.withStart("AAAA")
				.withCommand(8) // the command we're testing - 0x08
				.withSerial(8) // IBC serial 8
				.withDeviceData(deviceData)
				.build();

			//console.log(`sending message from ${JSON.stringify(input)}`);

			serialPortHelper.sendMessage(message);
		} catch (err) {
			return Promise.reject(err);
		}
	};

	// it.only("can send a key switch armed on IBC 8 where previous state was disarmed", function(done) {
	// 	var PacketBuilder = require("../../lib/builders/packet_builder");
	// 	var packetBuilder = new PacketBuilder();
	// 	var StringBuilder = require("../../lib/builders/string_builder");
	// 	var stringBuilder = new StringBuilder();

	// 	async.waterfall(
	// 		[
	// 			function(cb) {
	// 				// INITIAL STATE - DISARMED

	// 				/* TEST: AAAA 0A 08 0008 0840 (CRC)
	//              start - AAAA
	//              length - 0A
	//              command - 08
	//              serial - 0008
	//              data - 0840 (FIRST BYTE (DEVICE ID & TYPE) - 08 - IGNORED; second byte - 40 - switch disarmed and isolation relay on)
	//              crc - ?
	//              */

	// 				packetBuilder.reset();

	// 				//data
	// 				var deviceId = packetBuilder.createDeviceIdData(8); // unused
	// 				var deviceType = packetBuilder.createDeviceTypeData(0); // unused
	// 				var rawData = packetBuilder.createRawData([0, 0, 0, 0, 0, 0, 1, 0]); // key switch disarmed, isolation relay on

	// 				var deviceData = stringBuilder
	// 					.append(deviceId)
	// 					.to(deviceType)
	// 					.and(rawData)
	// 					.complete();

	// 				//complete packet
	// 				var message = packetBuilder
	// 					.withStart("AAAA")
	// 					.withCommand(8) // the command we're testing - 0x08
	// 					.withSerial(8) // IBC serial 8
	// 					.withDeviceData(deviceData)
	// 					.build();

	// 				serialPortHelper
	// 					.sendMessage(message)
	// 					.then(() => {
	// 						cb();
	// 					})
	// 					.catch(err => {
	// 						cb(err);
	// 					});
	// 			},
	// 			function(cb) {
	// 				// TEST STATE - ARMED

	// 				/* TEST: AAAA 0A 08 0008 08C0 (CRC)
	//              start - AAAA
	//              length - 0A
	//              command - 08
	//              serial - 0008
	//              data - 08C0 (FIRST BYTE (DEVICE ID & TYPE) - 08 - IGNORED; second byte - C0 - switch armed and isolation relay on)
	//              crc - ?
	//              */

	// 				packetBuilder.reset();

	// 				//data
	// 				var deviceId = packetBuilder.createDeviceIdData(8); // unused
	// 				var deviceType = packetBuilder.createDeviceTypeData(0); // unused
	// 				var rawData = packetBuilder.createRawData([0, 0, 0, 0, 0, 0, 1, 1]); // key switch armed, isolation relay on

	// 				var deviceData = stringBuilder
	// 					.append(deviceId)
	// 					.to(deviceType)
	// 					.and(rawData)
	// 					.complete();

	// 				//complete packet
	// 				var message = packetBuilder
	// 					.withStart("AAAA")
	// 					.withCommand(8) // the command we're testing - 0x08
	// 					.withSerial(8) // IBC serial 8
	// 					.withDeviceData(deviceData)
	// 					.build();

	// 				serialPortHelper
	// 					.sendMessage(message)
	// 					.then(() => {
	// 						cb();
	// 					})
	// 					.catch(err => {
	// 						cb(err);
	// 					});
	// 			},
	// 			function(cb) {
	// 				setTimeout(function() {
	// 					databaseHelper
	// 						.getNodeTreeData(8, 0)
	// 						.then(function(result) {
	// 							if (result == null || result.length == 0)
	// 								return cb(new Error("Empty result!"));

	// 							var ibc = result[0];
	// 							cb(null, {
	// 								ibc: ibc
	// 							});
	// 						})
	// 						.catch(function(err) {
	// 							cb(err);
	// 						});
	// 				}, 5000);
	// 			}
	// 		],
	// 		function(err, result) {
	// 			if (err) return done(err);

	// 			try {
	// 				expect(result.ibc["p.communication_status"]).to.equal(1);
	// 				expect(result.ibc["p.fire_button"]).to.equal(0);
	// 				expect(result.ibc["p.key_switch_status"]).to.equal(1);
	// 				expect(result.ibc["p.isolation_relay"]).to.equal(1);

	// 				done();
	// 			} catch (err) {
	// 				done(err);
	// 			}
	// 		}
	// 	);
	// });

	// it.only("can send an unknown 08 command", function(done) {
	// 	async.waterfall(
	// 		[
	// 			function(cb) {
	// 				var message = "aaaa0a08000d05428447";

	// 				serialPortHelper
	// 					.sendMessage(message)
	// 					.then(() => {
	// 						cb();
	// 					})
	// 					.catch(err => {
	// 						cb(err);
	// 					});
	// 			},
	// 			function(cb) {
	// 				setTimeout(function() {
	// 					databaseHelper
	// 						.getNodeTreeData(8, 0)
	// 						.then(function(result) {
	// 							if (result == null || result.length == 0)
	// 								return cb(new Error("Empty result!"));

	// 							return cb(result);
	// 						})
	// 						.catch(function(err) {
	// 							cb(err);
	// 						});
	// 				}, 5000);
	// 			}
	// 		],
	// 		function(err, result) {
	// 			if (err) return done(err);

	// 			try {
	// 				console.log(result);

	// 				done();
	// 			} catch (err) {
	// 				done(err);
	// 			}
	// 		}
	// 	);
	// });
});
