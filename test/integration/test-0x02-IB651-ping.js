/**
 * Created by grant on 2016/11/29.
 */

var expect = require('expect.js'),
	async = require('async');

describe("IB651-ping-request-test", function () {

	require('dotenv').config({
		path: './test/.env-test'
	});

	var ServerHelper = require('../helpers/server_helper');
	var serverHelper = new ServerHelper();

	var DatabaseHelper = require('../helpers/database_helper');
	var databaseHelper = new DatabaseHelper();

	var FileHelper = require('../helpers/file_helper');
	var fileHelper = new FileHelper();

	var SerialPortHelper = require('../helpers/serial_port_helper');
	var serialPortHelper = new SerialPortHelper();

	this.timeout(30000);
	
	const SerailPortService = require('../../lib/services/serial_port_service');
	let serialPortService = new SerailPortService;
	
	
	const MockHappn = require('../mocks/mock_happn');
	let mockHappn = null;

	before('setup comm port', function(done){
		mockHappn = new MockHappn();
		serialPortService.initialise(mockHappn).then(done());
	});



	// before('setup virtual serial ports', function (done) {

	// 	serialPortHelper.initialise()
	// 		.then(() => {
	// 			done();
	// 		})
	// 		.catch(err => {
	// 			done(err);
	// 		});
	// });

	before('start test server', function (done) {

		serverHelper.startServer()
			.then(() => {
				done();
			})
			.catch((err) => {
				done(err);
			});
	});

	beforeEach('cleaning up queues', function (done) {

		fileHelper.clearQueueFiles()
			.then(function () {
				done();
			})
			.catch(function (err) {
				done(err);
			});
	});

	beforeEach('cleaning up db', function (done) {

		databaseHelper.clearDatabase()
			.then(function () {
				done();
			})
			.catch(function (err) {
				done(err);
			});
	});

	after('stop test server', function (done) {

		serverHelper.stopServer()
			.then(() => {
				done();
			})
			.catch((err) => {
				done(err);
			});
	});

	it('can send a ping request containing IB651s 1, 2 & 3, where no IB651s currently in database', function (done) {

		// AAAA0E020001000100020003(CRC)
		// start - AAAA
		// length - 0E
		// command - 02
		// serial - 0001
		// data - 000100020003 (serials 1, 2, 3)
		// crc - ?

		var PacketBuilder = require('../../lib/builders/packet_builder');
		var packetBuilder = new PacketBuilder();

		async.waterfall([

			function (cb) {
				// set up the initial IBC and single ISC via an ISC ping
				var message = packetBuilder
					.withStart('AAAA')
					.withCommand(1)
					.withSerial(1)
					.withSerialData(1)
					.build();

				console.log('## INITIAL MESSAGE: ' + message);

				serialPortHelper.sendMessage(message)
					.then(() => {
						cb();
					})
					.catch((err) => {
						cb(err);
					});
			},
			function (cb) {

				packetBuilder.reset();

				// now send an ISC ping with 3 IB651's
				var message = packetBuilder
					.withStart('AAAA')
					.withCommand(2)
					.withSerial(1)
					.withSerialData(256)
					.withSerialData(512)
					.withSerialData(768)
					.build();

				console.log('## PING MESSAGE: ' + message);

				serialPortHelper.sendMessage(message)
					.then(() => {
						cb();
					})
					.catch((err) => {
						cb(err);
					});
			},
			function (cb) {
				setTimeout(function () {
					databaseHelper.getNodeTreeData(1, 1)
						.then(function (result) {

							if (result == null || result.length == 0)
								return cb(new Error('Empty result!'));

							var ib651_1 = null,
								ib651_2 = null,
								ib651_3 = null;

							console.log(result);
							result.forEach(x => {
								if (parseInt(x["c.serial"]) == 1 && x["c.type_id"] == 2)
									ib651_1 = x;

								if (parseInt(x["c.serial"]) == 2 && x["c.type_id"] == 2)
									ib651_2 = x;

								if (parseInt(x["c.serial"]) == 3 && x["c.type_id"] == 2)
									ib651_3 = x;
							});

							cb(null, {
								ib651_1: ib651_1,
								ib651_2: ib651_2,
								ib651_3: ib651_3
							});
						})
						.catch(function (err) {
							cb(err);
						});

				}, 5000);
			}
		], function (err, result) {

			if (err)
				return done(err);

			console.log(result);

			try {
				//check communication status on each
				expect(result.ib651_1["c.communication_status"]).to.equal(1);
				expect(result.ib651_1["c.window_id"]).to.equal(1);

				expect(result.ib651_2["c.communication_status"]).to.equal(1);
				expect(result.ib651_2["c.window_id"]).to.equal(2);

				expect(result.ib651_3["c.communication_status"]).to.equal(1);
				expect(result.ib651_3["c.window_id"]).to.equal(3);

				done();
			} catch (err) {
				done(err);
			}

		});
	});

	it('can send a ping request containing IB651s 1, 2 & 3, where IB651s 1 & 2 are currently in database', function (done) {

		/* INITIAL STATE: AAAA0E02000100010002(CRC)
         start - AAAA
         length - 0E
         command - 02
         serial - 0001
         data - 00010002 (serials 1, 2)
         crc - ?
         */

		/* TEST: AAAA0E020001000100020003(CRC)
         start - AAAA
         length - 0E
         command - 02
         serial - 0001
         data - 000100020003 (serials 1, 2, 3)
         crc - ?
         */

		var PacketBuilder = require('../../lib/builders/packet_builder');
		var packetBuilder = new PacketBuilder();

		async.waterfall([

			function (cb) {
				// set up the initial IBC and single ISC via an ISC ping
				var message = packetBuilder
					.withStart('AAAA')
					.withCommand(1)
					.withSerial(1)
					.withSerialData(1)
					.build();

				console.log('## MESSAGE: ' + message);

				serialPortHelper.sendMessage(message)
					.then(() => {
						cb();
					})
					.catch((err) => {
						cb(err);
					});
			},
			function (cb) {
				packetBuilder.reset();

				var initial = packetBuilder
					.withStart('AAAA')
					.withCommand(2)
					.withSerial(1)
					.withSerialData(256)
					.withSerialData(512)
					.build();

				console.log('## INITIAL: ' + initial);

				serialPortHelper.sendMessage(initial)
					.then(() => {
						cb();
					})
					.catch((err) => {
						cb(err);
					});
			},
			function (cb) {
				packetBuilder.reset();

				var message = packetBuilder
					.withStart('AAAA')
					.withCommand(2)
					.withSerial(1)
					.withSerialData(256)
					.withSerialData(512)
					.withSerialData(768)
					.build();

				console.log('## MESSAGE: ' + message);

				serialPortHelper.sendMessage(message)
					.then(() => {
						cb();
					})
					.catch((err) => {
						cb(err);
					});
			},
			function (cb) {
				setTimeout(function () {

					databaseHelper.getNodeTreeData(1, 1)
						.then(function (result) {

							if (result == null || result.length == 0)
								return cb(new Error('Empty result!'));

							var ib651_1 = null,
								ib651_2 = null,
								ib651_3 = null;

							result.forEach(x => {
								if (parseInt(x["c.serial"]) == 1 && x["c.type_id"] == 2)
									ib651_1 = x;

								if (parseInt(x["c.serial"]) == 2 && x["c.type_id"] == 2)
									ib651_2 = x;

								if (parseInt(x["c.serial"]) == 3 && x["c.type_id"] == 2)
									ib651_3 = x;
							});

							console.log({
								ib651_1: ib651_1,
								ib651_2: ib651_2,
								ib651_3: ib651_3
							});
							cb(null, {
								ib651_1: ib651_1,
								ib651_2: ib651_2,
								ib651_3: ib651_3
							});
						})
						.catch(function (err) {
							cb(err);
						});

				}, 10000);
			}
		], function (err, result) {

			if (err)
				return done(err);

			try {
				//check communication status on each
				expect(result.ib651_1["c.communication_status"]).to.equal(1);
				expect(result.ib651_1["c.window_id"]).to.equal(1);

				expect(result.ib651_2["c.communication_status"]).to.equal(1);
				expect(result.ib651_2["c.window_id"]).to.equal(2);

				expect(result.ib651_3["c.communication_status"]).to.equal(1);
				expect(result.ib651_3["c.window_id"]).to.equal(3);

				done();
			} catch (err) {
				done(err);
			}
		});
	});

	it('can send a ping request containing IB651s 1, 2 & 3, where only IB651 4 is currently in database', function (done) {

		var PacketBuilder = require('../../lib/builders/packet_builder');
		var packetBuilder = new PacketBuilder();

		async.waterfall([

			function (cb) {
				// set up the initial IBC and single ISC via an ISC ping
				var message = packetBuilder
					.withStart('AAAA')
					.withCommand(1)
					.withSerial(1)
					.withSerialData(1)
					.build();

				serialPortHelper.sendMessage(message)
					.then(() => {
						cb();
					})
					.catch((err) => {
						cb(err);
					});
			},
			function (cb) {

				packetBuilder.reset();

				/* INITIAL STATE: AAAA0E0200010004(CRC)
                 start - AAAA
                 length - 0E
                 command - 02
                 serial - 0001
                 data - 0004 (serial 4)
                 crc - ?
                 */

				var initial = packetBuilder
					.withStart('AAAA')
					.withCommand(2)
					.withSerial(1)
					.withSerialData(1024)
					.build();

				serialPortHelper.sendMessage(initial)
					.then(() => {
						cb();
					})
					.catch((err) => {
						cb(err);
					});
			},
			function (cb) {
				packetBuilder.reset();

				/* TEST: AAAA0E020001000100020003(CRC)
                 start - AAAA
                 length - 0E
                 command - 02
                 serial - 0001
                 data - 000100020003 (serials 1, 2, 3)
                 crc - ?
                 */

				var message = packetBuilder
					.withStart('AAAA')
					.withCommand(2)
					.withSerial(1)
					.withSerialData(256)
					.withSerialData(512)
					.withSerialData(768)
					.build();

				serialPortHelper.sendMessage(message)
					.then(() => {
						cb();
					})
					.catch((err) => {
						cb(err);
					});
			},
			function (cb) {

				setTimeout(function () {

					databaseHelper.getNodeTreeData(1, 1) // get node data for ISC serial 1
						.then(function (result) {

							console.log(result);

							if (result == null || result.length == 0)
								return cb(new Error('Empty result!'));

							var ib651_1 = null,
								ib651_2 = null,
								ib651_3 = null,
								ib651_4 = null;

							result.forEach(x => {

								if (parseInt(x["c.serial"]) == 1 && x["c.type_id"] == 2)
									ib651_1 = x;

								if (parseInt(x["c.serial"]) == 2 && x["c.type_id"] == 2)
									ib651_2 = x;

								if (parseInt(x["c.serial"]) == 3 && x["c.type_id"] == 2)
									ib651_3 = x;

								if (parseInt(x["c.serial"]) == 4 && x["c.type_id"] == 2)
									ib651_4 = x;
							});

							cb(null, {
								ib651_1: ib651_1,
								ib651_2: ib651_2,
								ib651_3: ib651_3,
								ib651_4: ib651_4
							});
						})
						.catch(function (err) {
							cb(err);
						});
				}, 5000);
			}
		], function (err, result) {

			if (err)
				return done(err);

			//check communication status on each

			try {
				expect(result.ib651_1["c.communication_status"]).to.equal(1);
				expect(result.ib651_1["c.parent_id"]).to.equal(result.ib651_1["p.id"]);
				expect(result.ib651_1["c.window_id"]).to.equal(1);

				expect(result.ib651_2["c.communication_status"]).to.equal(1);
				expect(result.ib651_2["c.parent_id"]).to.equal(result.ib651_2["p.id"]);
				expect(result.ib651_2["c.window_id"]).to.equal(2);

				expect(result.ib651_3["c.communication_status"]).to.equal(1);
				expect(result.ib651_3["c.parent_id"]).to.equal(result.ib651_3["p.id"]);
				expect(result.ib651_3["c.window_id"]).to.equal(3);

				expect(result.ib651_4["c.communication_status"]).to.equal(0);
				expect(result.ib651_4["c.parent_id"]).to.equal(result.ib651_4["p.id"]);
				expect(result.ib651_4["c.window_id"]).to.equal(0);

				done();
			} catch (err) {
				done(err);
			}
		});
	});

	it('can send a ping request that changes the ordering of window ids of existing IB651s in database', function (done) {

		var PacketBuilder = require('../../lib/builders/packet_builder');
		var packetBuilder = new PacketBuilder();

		async.waterfall([

			function (cb) {
				// set up the initial IBC and single ISC via an ISC ping
				var message = packetBuilder
					.withStart('AAAA')
					.withCommand(1)
					.withSerial(1)
					.withSerialData(1)
					.build();

				serialPortHelper.sendMessage(message)
					.then(() => {
						cb();
					})
					.catch((err) => {
						cb(err);
					});
			},
			function (cb) {
				packetBuilder.reset();

				/* INITIAL STATE: AAAA0E0200010002(CRC)
                 start - AAAA
                 length - 0E
                 command - 02
                 serial - 0001
                 data - 00010002 (serials 1 & 2)
                 crc - ?
                 */

				var initial = packetBuilder
					.withStart('AAAA')
					.withCommand(2)
					.withSerial(1)
					.withSerialData(256)
					.withSerialData(512)
					.build();

				serialPortHelper.sendMessage(initial)
					.then(() => {
						cb();
					})
					.catch((err) => {
						cb(err);
					});
			},
			function (cb) {
				packetBuilder.reset();

				/* TEST: AAAA0E020001000200010003(CRC)
                 start - AAAA
                 length - 0E
                 command - 02
                 serial - 0001
                 data - 000200010003 (serials 2, 1, 3)
                 crc - ?
                 */

				var message = packetBuilder
					.withStart('AAAA')
					.withCommand(2)
					.withSerial(1)
					.withSerialData(512)
					.withSerialData(256)
					.withSerialData(768)
					.build();

				serialPortHelper.sendMessage(message)
					.then(() => {
						cb();
					})
					.catch((err) => {
						cb(err);
					});
			},
			function (cb) {
				setTimeout(function () {

					databaseHelper.getNodeTreeData(1, 1)
						.then(function (result) {

							if (result == null || result.length == 0)
								return cb(new Error('Empty result!'));

							var ib651_1 = null,
								ib651_2 = null,
								ib651_3 = null;

							result.forEach(x => {
								if (x["c.serial"] == 2 && x["c.type_id"] == 2)
									ib651_2 = x;

								if (x["c.serial"] == 1 && x["c.type_id"] == 2)
									ib651_1 = x;

								if (x["c.serial"] == 3 && x["c.type_id"] == 2)
									ib651_3 = x;
							});

							cb(null, {
								ib651_1: ib651_1,
								ib651_2: ib651_2,
								ib651_3: ib651_3
							});
						})
						.catch(function (err) {
							console.log(err);
							cb(err);
						});
				}, 5000);
			}
		], function (err, result) {

			if (err)
				return done(err);

			//check window_id ordering on each

			try {
				expect(result.ib651_2["c.window_id"]).to.equal(1);
				expect(result.ib651_1["c.window_id"]).to.equal(2);
				expect(result.ib651_3["c.window_id"]).to.equal(3);

				done();
			} catch (err) {
				done(err);
			}
		});
	});
});