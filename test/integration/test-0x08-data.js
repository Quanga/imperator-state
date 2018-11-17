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

	before("cleaning up db", async function() {
		try {
			await databaseHelper.initialise();
			await databaseHelper.clearDatabase();
			await serverHelper.startServer();
		} catch (err) {
			return Promise.reject(err);
		}
	});

	after("stop test server", async function() {
		await serverHelper.stopServer();
	});

	let timer = ms => {
		return new Promise(resolve => setTimeout(resolve, ms));
	};

	it.only("can send a key switch armed on IBC 8 where previous state was disarmed", async function() {
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

	it.only("can send a key switch armed on IBC 8 where previous state dis", async function() {
		var PacketBuilder = require("../../lib/builders/packet_builder");
		var packetBuilder = new PacketBuilder();
		var StringBuilder = require("../../lib/builders/string_builder");
		var stringBuilder = new StringBuilder();

		let step1 = async () => {
			packetBuilder.reset();

			var message = packetBuilder
				.withStart("AAAA")
				.withCommand(1)
				.withSerial(12)
				.withSerialData(22)
				.build();
			await serialPortHelper.sendMessage(message);

			packetBuilder.reset();

			let messageb = packetBuilder
				.withStart("AAAA")
				.withCommand(2)
				.withSerial(22)
				.withSerialData(256)
				.withSerialData(512)
				.withSerialData(768)
				.build();

			await serialPortHelper.sendMessage(messageb);
			// INITIAL STATE - DISARMED

			/* TEST: AAAA 0A 08 0008 0840 (CRC)
		 start - AAAA
		 length - 0A
		 command - 08
		 serial - 0008
		 data - 0840 (FIRST BYTE (DEVICE ID & TYPE) - 08 - IGNORED; second byte - 40 - switch disarmed and isolation relay on)
		 crc - ?
		 */

			packetBuilder.reset();

			//data
			var deviceId = packetBuilder.createDeviceIdData(12); // unused
			var deviceType = packetBuilder.createDeviceTypeData(0); // unused
			var rawData = packetBuilder.createRawData([0, 0, 0, 0, 0, 0, 1, 1]); // key switch disarmed, isolation relay on

			var deviceData = stringBuilder
				.append(deviceId)
				.to(deviceType)
				.and(rawData)
				.complete();

			//complete packet
			var messagee = packetBuilder
				.withStart("AAAA")
				.withCommand(8) // the command we're testing - 0x08
				.withSerial(12) // IBC serial 8
				.withDeviceData(deviceData)
				.build();

			await serialPortHelper.sendMessage(messagee);
		};

		let step2 = async () => {
			// TEST STATE - ARMED

			/* TEST: AAAA 0A 08 0008 08C0 (CRC)
		 start - AAAA
		 length - 0A
		 command - 08
		 serial - 0008
		 data - 08C0 (FIRST BYTE (DEVICE ID & TYPE) - 08 - IGNORED; second byte - C0 - switch armed and isolation relay on)
		 crc - ?
		 */

			packetBuilder.reset();

			//data
			var deviceId = packetBuilder.createDeviceIdData(12); // unused
			var deviceType = packetBuilder.createDeviceTypeData(0); // unused
			var rawData = packetBuilder.createRawData([0, 0, 0, 0, 0, 0, 1, 1]); // key switch armed, isolation relay on

			var deviceData = stringBuilder
				.append(deviceId)
				.to(deviceType)
				.and(rawData)
				.complete();

			//complete packet
			var message = packetBuilder
				.withStart("AAAA")
				.withCommand(8) // the command we're testing - 0x08
				.withSerial(12) // IBC serial 8
				.withDeviceData(deviceData)
				.build();

			await serialPortHelper.sendMessage(message);
		};

		let step3 = async () => {
			try {
				let result = await databaseHelper.getNodeTreeData(12, 0);

				if (result == null || result.length == 0) {
					return new Error("Empty result!");
				}

				let ibc = result[0];
				return { ibc: ibc };
			} catch (err) {
				return Promise.reject(err);
			}
		};

		let step4 = async result => {
			expect(result.ibc["p.communication_status"]).to.equal(1);
			expect(result.ibc["p.fire_button"]).to.equal(0);
			expect(result.ibc["p.key_switch_status"]).to.equal(1);
			expect(result.ibc["p.isolation_relay"]).to.equal(1);
		};

		let test = async () => {
			try {
				await timer(4500);

				await step1();
				await timer(1000);
				await step2();
				await timer(2000);

				let result = await step3();
				await step4(result);
			} catch (err) {
				return Promise.reject(err);
			}
		};

		return test();
	});

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
