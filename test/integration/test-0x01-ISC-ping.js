/**
 * Created by grant on 2016/11/29.
 */

var async = require("async"),
	expect = require("expect.js");

describe("ISC-ping-request-test", function() {
	require("dotenv").config({ path: "./test/.env-test" });

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
	// 		})
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

	beforeEach("clean up queues", function(done) {
		fileHelper
			.clearQueueFiles()
			.then(function() {
				return done();
			})
			.catch(function(err) {
				return done(err);
			});
	});

	beforeEach("clean up db", function(done) {
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

	it("can send a ping request containing ISCs 1, 2 & 3, where no ISCs currently in database", function(done) {
		// AAAA0E010001000100020003(CRC)
		// start - AAAA
		// length - 0E
		// command - 01
		// serial - 0001
		// data - 000100020003 (serials 1, 2, 3)
		// crc - ?

		var PacketBuilder = require("../../lib/builders/packet_builder");
		var packetBuilder = new PacketBuilder();

		async.waterfall(
			[
				function(cb) {
					var message = packetBuilder
						.withStart("AAAA")
						.withCommand(1)
						.withSerial(1)
						.withSerialData(1)
						.withSerialData(2)
						.withSerialData(3)
						.build();

					console.log("sending");

					serialPortHelper
						.sendMessage(message)
						.then(function() {
							cb();
						})
						.catch(function(err) {
							console.log("port error: ", err);
							cb(err);
						});
				},
				function(cb) {
					setTimeout(function() {
						databaseHelper
							.getNodeTreeData(1, 0)
							.then(function(result) {
								if (result == null || result.length == 0)
									return cb(new Error("Empty result!"));

								var isc1 = null,
									isc2 = null,
									isc3 = null;

								result.forEach(x => {
									if (x["c.serial"] == 1 && x["c.type_id"] == 1) isc1 = x;

									if (x["c.serial"] == 2 && x["c.type_id"] == 1) isc2 = x;

									if (x["c.serial"] == 3 && x["c.type_id"] == 1) isc3 = x;
								});

								cb(null, { isc1: isc1, isc2: isc2, isc3: isc3 });
							})
							.catch(function(err) {
								cb(err);
							});
					}, 10000);
				}
			],
			function(err, result) {
				if (err) return done(err);

				try {
					expect(result.isc1["c.communication_status"]).to.equal(1); // communication status
					expect(result.isc2["c.communication_status"]).to.equal(1);
					expect(result.isc3["c.communication_status"]).to.equal(1);

					done();
				} catch (err) {
					done(err);
				}
			}
		);
	});

	it("can send a ping request containing ISCs 1, 2 & 3, where ISCs 1 & 2 are currently in database", function(done) {
		/* INITIAL STATE: AAAA0E01000100010002(CRC)
         start - AAAA
         length - 0E
         command - 01
         serial - 0001
         data - 00010002 (serials 1, 2)
         crc - ?
         */

		/* TEST: AAAA0E010001000100020003(CRC)
         start - AAAA
         length - 0E
         command - 01
         serial - 0001
         data - 000100020003 (serials 1, 2, 3)
         crc - ?
         */

		var PacketBuilder = require("../../lib/builders/packet_builder");
		var packetBuilder = new PacketBuilder();

		async.waterfall(
			[
				function(cb) {
					var initial = packetBuilder
						.withStart("AAAA")
						.withCommand(1)
						.withSerial(1)
						.withSerialData(1)
						.withSerialData(2)
						.build();

					console.log("## INITIAL: " + initial);

					serialPortHelper
						.sendMessage(initial)
						.then(function() {
							cb();
						})
						.catch(function(err) {
							console.log("port error: ", err);
							cb(err);
						});
				},
				function(cb) {
					var message = packetBuilder.withSerialData(3).build();

					serialPortHelper
						.sendMessage(message)
						.then(function() {
							cb();
						})
						.catch(function(err) {
							console.log("port error: ", err);
							cb(err);
						});
				},
				function(cb) {
					setTimeout(function() {
						databaseHelper
							.getNodeTreeData(1, 0)
							.then(function(result) {
								if (result == null || result.length == 0)
									return cb(new Error("Empty result!"));

								var isc1 = null,
									isc2 = null,
									isc3 = null;

								result.forEach(x => {
									if (x["c.serial"] == 1 && x["c.type_id"] == 1) isc1 = x;

									if (x["c.serial"] == 2 && x["c.type_id"] == 1) isc2 = x;

									if (x["c.serial"] == 3 && x["c.type_id"] == 1) isc3 = x;
								});

								cb(null, { isc1: isc1, isc2: isc2, isc3: isc3 });
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
					//check communication status on each
					expect(result.isc1["c.communication_status"]).to.equal(1);
					expect(result.isc2["c.communication_status"]).to.equal(1);
					expect(result.isc3["c.communication_status"]).to.equal(1);

					done();
				} catch (err) {
					done(err);
				}
			}
		);
	});

	it("can send a ping request containing ISCs 1, 2 & 3, where only ISC 4 is currently in database", function(done) {
		var PacketBuilder = require("../../lib/builders/packet_builder");
		var packetBuilder = new PacketBuilder();

		async.waterfall(
			[
				function(cb) {
					/* INITIAL STATE: AAAA0E0100010004(CRC)
                 start - AAAA
                 length - 0E
                 command - 01
                 serial - 0001
                 data - 0004 (serial 4)
                 crc - ?
                 */

					var initial = packetBuilder
						.withStart("AAAA")
						.withCommand(1)
						.withSerial(1)
						.withSerialData(4)
						.build();

					console.log("## INITIAL: " + initial);

					serialPortHelper
						.sendMessage(initial)
						.then(function() {
							cb();
						})
						.catch(function(err) {
							console.log("port error: ", err);
							cb(err);
						});
				},
				function(cb) {
					packetBuilder.reset();

					/* TEST: AAAA0E010001000100020003(CRC)
                 start - AAAA
                 length - 0E
                 command - 01
                 serial - 0001
                 data - 000100020003 (serials 1, 2, 3)
                 crc - ?
                 */

					var message = packetBuilder
						.withStart("AAAA")
						.withCommand(1)
						.withSerial(1)
						.withSerialData(1)
						.withSerialData(2)
						.withSerialData(3)
						.build();

					console.log("## MESSAGE: " + message);

					serialPortHelper
						.sendMessage(message)
						.then(function() {
							cb();
						})
						.catch(function(err) {
							console.log("port error: ", err);
							cb(err);
						});
				},
				function(cb) {
					setTimeout(function() {
						console.log("## GETTING TREE DATA....");

						databaseHelper
							.getNodeTreeData(1, 0)
							.then(function(result) {
								if (result == null || result.length == 0)
									return cb(new Error("Empty result!"));

								console.log("### NODE TREE RESULT: " + JSON.stringify(result));

								var isc1 = null,
									isc2 = null,
									isc3 = null,
									isc4 = null;

								result.forEach(x => {
									if (x["c.serial"] == 1 && x["c.type_id"] == 1) isc1 = x;

									if (x["c.serial"] == 2 && x["c.type_id"] == 1) isc2 = x;

									if (x["c.serial"] == 3 && x["c.type_id"] == 1) isc3 = x;

									if (x["c.serial"] == 4 && x["c.type_id"] == 1) isc4 = x;
								});

								cb(null, { isc1: isc1, isc2: isc2, isc3: isc3, isc4: isc4 });
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
					//check communication status on each
					expect(result.isc1["c.communication_status"]).to.equal(1);
					expect(result.isc2["c.communication_status"]).to.equal(1);
					expect(result.isc3["c.communication_status"]).to.equal(1);
					expect(result.isc4["c.communication_status"]).to.equal(1);

					done();
				} catch (err) {
					done(err);
				}
			}
		);
	});
});
