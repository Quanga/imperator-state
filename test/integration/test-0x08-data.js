const expect = require("expect.js");
const async = require("async");

describe("0x08-IBC-data-request-test", function() {
	require("dotenv").config({
		path: "./test/.env-test"
	});

	var ServerHelper = require("../helpers/server_helper");
	var serverHelper = new ServerHelper();

	var DatabaseHelper = require("../helpers/database_helper");
	var databaseHelper = new DatabaseHelper();

	var FileHelper = require("../helpers/file_helper");
	var fileHelper = new FileHelper();

	var SerialPortHelper = require("../helpers/serial_port_helper");
	var serialPortHelper = new SerialPortHelper();

	const SerailPortService = require("../../lib/services/serial_port_service");
	let serialPortService = new SerailPortService();

	const MockHappn = require("../mocks/mock_happn");
	let mockHappn = null;

	this.timeout(30000);

	// before('setup virtual serial ports', function (done) {

	// 	serialPortHelper.initialise()
	// 		.then(() => {
	// 			done();
	// 		})
	// 		.catch(err => {
	// 			done(err);
	// 		});
	// });

	before("setup comm port", function(done) {
		mockHappn = new MockHappn();
		serialPortService.initialise(mockHappn).then(done());
	});

	before("start test server", function(done) {
		serverHelper
			.startServer()
			.then(() => {
				done();
			})
			.catch(err => {
				done(err);
			});
	});

	beforeEach("cleaning up queues", function(done) {
		fileHelper
			.clearQueueFiles()
			.then(function() {
				done();
			})
			.catch(function(err) {
				done(err);
			});
	});

	beforeEach("cleaning up db", function(done) {
		databaseHelper
			.clearDatabase()
			.then(function() {
				done();
			})
			.catch(function(err) {
				done(err);
			});
	});

	after("stop test server", function(done) {
		serverHelper
			.stopServer()
			.then(() => {
				done();
			})
			.catch(err => {
				done(err);
			});
	});

	it("can send a key switch disarmed on IBC 8", function(done) {
		const PacketBuilder = require("../../lib/builders/packet_builder");
		const packetBuilder = new PacketBuilder();
		const StringBuilder = require("../../lib/builders/string_builder");
		const stringBuilder = new StringBuilder();

		async.waterfall(
			[
				function(cb) {
					/* TEST: AAAA 0A 08 0008 0840 (CRC)

                 start - AAAA
                 length - 0A
                 command - 08
                 serial - 0001
                 data - 0840 (FIRST BYTE (DEVICE ID & TYPE) - 08 - IGNORED; second byte - 40 - switch disarmed and isolation relay on)
                 crc - DC8E
                 */

					//data
					let deviceId = packetBuilder.createDeviceIdData(8);
					let deviceType = packetBuilder.createDeviceTypeData(0);
					let rawData = packetBuilder.createRawData([0, 0, 0, 0, 0, 0, 1, 0]); // key switch disarmed, isolation relay on

					let deviceData = stringBuilder
						.append(deviceId)
						.to(deviceType)
						.and(rawData)
						.complete();

					//complete packet
					var message = packetBuilder
						.withStart("AAAA")
						.withCommand(8) // the command we're testing - 0x08
						.withSerial(8) // IBC serial 8
						.withDeviceData(deviceData)
						.build();

					console.log("sending message");
					serialPortHelper
						.sendMessage(message)
						.then(() => {
							cb();
						})
						.catch(err => {
							cb(err);
						});
				},
				function(cb) {
					setTimeout(function() {
						databaseHelper
							.getNodeTreeData(8, 0)
							.then(function(result) {
								if (result == null || result.length == 0)
									return cb(new Error("Empty result!"));

								var ibc = result[0];
								cb(null, {
									ibc: ibc
								});
							})
							.catch(function(err) {
								cb(err);
							});
					}, 5000);
				}
			],
			function(err, result) {
				if (err) {
					console.log("error00000", err);
					return done(err);
				}

				//

				try {
					expect(result.ibc["p.communication_status"]).to.equal(1);
					expect(result.ibc["p.fire_button"]).to.equal(0);
					expect(result.ibc["p.key_switch_status"]).to.equal(0);
					expect(result.ibc["p.isolation_relay"]).to.equal(1);
					console.log("result correct");
					done();
				} catch (err) {
					console.log(err);
					done(err);
				}
			}
		);
	});

	it("can send a key switch armed on IBC 8", function(done) {
		let PacketBuilder = require("../../lib/builders/packet_builder");
		let packetBuilder = new PacketBuilder();
		let StringBuilder = require("../../lib/builders/string_builder");
		let stringBuilder = new StringBuilder();

		async.waterfall(
			[
				function(cb) {
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
					var deviceId = packetBuilder.createDeviceIdData(8);
					var deviceType = packetBuilder.createDeviceTypeData(0);
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
						.withSerial(8) // IBC serial 8
						.withDeviceData(deviceData)
						.build();

					serialPortHelper
						.sendMessage(message)
						.then(() => {
							cb();
						})
						.catch(err => {
							cb(err);
						});
				},
				function(cb) {
					setTimeout(function() {
						databaseHelper
							.getNodeTreeData(8, 0)
							.then(function(result) {
								if (result == null || result.length == 0)
									return cb(new Error("Empty result!"));

								var ibc = result[0];
								cb(null, {
									ibc: ibc
								});
							})
							.catch(function(err) {
								cb(err);
							});
					}, 5000);
				}
			],
			function(err, result) {
				if (err) return done(err);

				try {
					expect(result.ibc["p.communication_status"]).to.equal(1);
					expect(result.ibc["p.fire_button"]).to.equal(0);
					expect(result.ibc["p.key_switch_status"]).to.equal(1);
					expect(result.ibc["p.isolation_relay"]).to.equal(1);

					done();
				} catch (err) {
					done(err);
				}
			}
		);
	});

	it("can send a key switch armed on IBC 8 where previous state was disarmed", function(done) {
		var PacketBuilder = require("../../lib/builders/packet_builder");
		var packetBuilder = new PacketBuilder();
		var StringBuilder = require("../../lib/builders/string_builder");
		var stringBuilder = new StringBuilder();

		async.waterfall(
			[
				function(cb) {
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
					var deviceId = packetBuilder.createDeviceIdData(8); // unused
					var deviceType = packetBuilder.createDeviceTypeData(0); // unused
					var rawData = packetBuilder.createRawData([0, 0, 0, 0, 0, 0, 1, 0]); // key switch disarmed, isolation relay on

					var deviceData = stringBuilder
						.append(deviceId)
						.to(deviceType)
						.and(rawData)
						.complete();

					//complete packet
					var message = packetBuilder
						.withStart("AAAA")
						.withCommand(8) // the command we're testing - 0x08
						.withSerial(8) // IBC serial 8
						.withDeviceData(deviceData)
						.build();

					serialPortHelper
						.sendMessage(message)
						.then(() => {
							cb();
						})
						.catch(err => {
							cb(err);
						});
				},
				function(cb) {
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
					var deviceId = packetBuilder.createDeviceIdData(8); // unused
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
						.withSerial(8) // IBC serial 8
						.withDeviceData(deviceData)
						.build();

					serialPortHelper
						.sendMessage(message)
						.then(() => {
							cb();
						})
						.catch(err => {
							cb(err);
						});
				},
				function(cb) {
					setTimeout(function() {
						databaseHelper
							.getNodeTreeData(8, 0)
							.then(function(result) {
								if (result == null || result.length == 0)
									return cb(new Error("Empty result!"));

								var ibc = result[0];
								console.log(ibc);
								cb(null, {
									ibc: ibc
								});
							})
							.catch(function(err) {
								cb(err);
							});
					}, 5000);
				}
			],
			function(err, result) {
				if (err) return done(err);

				try {
					expect(result.ibc["p.communication_status"]).to.equal(1);
					expect(result.ibc["p.fire_button"]).to.equal(0);
					expect(result.ibc["p.key_switch_status"]).to.equal(1);
					expect(result.ibc["p.isolation_relay"]).to.equal(1);

					done();
				} catch (err) {
					done(err);
				}
			}
		);
	});

	it("can send an unknown 08 command", function(done) {
		async.waterfall(
			[
				function(cb) {
					var message = "aaaa0a08000d05428447";

					serialPortHelper
						.sendMessage(message)
						.then(() => {
							cb();
						})
						.catch(err => {
							cb(err);
						});
				},
				function(cb) {
					setTimeout(function() {
						databaseHelper
							.getNodeTreeData(8, 0)
							.then(function(result) {
								if (result == null || result.length == 0)
									return cb(new Error("Empty result!"));

								return cb(result);
							})
							.catch(function(err) {
								cb(err);
							});
					}, 5000);
				}
			],
			function(err, result) {
				if (err) return done(err);

				try {
					console.log(result);

					done();
				} catch (err) {
					done(err);
				}
			}
		);
	});
});
