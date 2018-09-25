/**
 * Created by grant on 2017/01/03.
 */

const expect = require('expect.js'),
	async = require('async');

describe("data-list-request-test", function () {

	require('dotenv').config({
		path: './test/.env-test'
	});

	const ServerHelper = require('../helpers/server_helper');
	let serverHelper = new ServerHelper();

	const DatabaseHelper = require('../helpers/database_helper');
	let databaseHelper = new DatabaseHelper();

	const FileHelper = require('../helpers/file_helper');
	let fileHelper = new FileHelper();

	const SerialPortHelper = require('../helpers/serial_port_helper');
	let serialPortHelper = new SerialPortHelper();

	this.timeout(30000);

	before('setup virtual serial ports', function (done) {

		serialPortHelper.initialise()
			.then(() => {
				done();
			})
			.catch(err => {
				done(err);
			});
	});

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

	it('can send a data list request containing one ISC with IB651s 1, 2 & 3', function (done) {

		// AAAA100300014030212022402310(CRC)
		// start - AAAA
		// length - 10
		// command - 03
		// serial - 0001
		// data - 4030 2120 2240 2310 (data for IB651s)
		// crc - ?

		var PacketBuilder = require('../../lib/builders/packet_builder');
		var packetBuilder = new PacketBuilder();
		var StringBuilder = require('../../lib/builders/string_builder');
		var stringBuilder = new StringBuilder();

		async.waterfall([

			//function (cb) {
			//
			//    // set up the initial IBC with a single ISC via ping request (0x01)
			//    var initial = packetBuilder
			//        .withStart('AAAA')
			//        .withCommand(1)
			//        .withSerial(1)
			//        .withSerialData(1)
			//        .build();
			//
			//    serialPortHelper.sendMessage(initial)
			//        .then(function () {
			//            cb();
			//        })
			//        .catch(function (err) {
			//            console.log('port error: ', err);
			//            cb(err);
			//        })
			//},
			function (cb) {

				packetBuilder.reset();

				//now set up the IB651's via ping request (0x02)

				var initial = packetBuilder
					.withStart('AAAA')
					.withCommand(2)
					.withSerial(1)
					.withSerialData(256)
					.withSerialData(512)
					.withSerialData(768)
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

				/* TEST: AAAA100300014030212022402310(CRC)
                 start - AAAA
                 length - 10
                 command - 03
                 serial - 0001
                 data - 4030 2120 2240 2310 (data for ISC serial 1 and IB651s serials 1, 2, 3)
                 crc - ?
                 */

				//ISC data
				var iscDeviceId = packetBuilder.createDeviceIdData(0);
				var iscDeviceType = packetBuilder.createDeviceTypeData(1); // ISC is type id 1
				var iscRawData = packetBuilder.createRawData([0, 0, 0, 0, 1, 1, 0, 0]); // 30 hex = 00001100 bin (little endian)

				var iscDeviceData = stringBuilder
					.append(iscDeviceId)
					.to(iscDeviceType)
					.and(iscRawData)
					.complete();

				//IB651 # 1 data
				var ib651_1_Id = packetBuilder.createDeviceIdData(1);
				var ib651_1_Type = packetBuilder.createDeviceTypeData(2); // IB651 is type id 2
				var ib651_1_RawData = packetBuilder.createRawData([0, 0, 0, 0, 0, 1, 0, 0]); //20 hex = 00000100 binary (little endian)

				var ib651_1_DeviceData = stringBuilder
					.append(ib651_1_Id)
					.to(ib651_1_Type)
					.and(ib651_1_RawData)
					.complete();

				//IB651 # 2 data
				var ib651_2_Id = packetBuilder.createDeviceIdData(2);
				var ib651_2_Type = packetBuilder.createDeviceTypeData(2); // IB651 is type id 2
				var ib651_2_RawData = packetBuilder.createRawData([0, 0, 0, 0, 0, 0, 1, 0]); //40 hex = 00000010 binary (little endian)

				var ib651_2_DeviceData = stringBuilder
					.append(ib651_2_Id)
					.to(ib651_2_Type)
					.and(ib651_2_RawData)
					.complete();

				//IB651 # 3 data
				var ib651_3_Id = packetBuilder.createDeviceIdData(3);
				var ib651_3_Type = packetBuilder.createDeviceTypeData(2); // IB651 is type id 2
				var ib651_3_RawData = packetBuilder.createRawData([0, 0, 0, 0, 1, 0, 1, 0]); // 10 hex = 00001000 binary (little endian)

				var ib651_3_DeviceData = stringBuilder
					.append(ib651_3_Id)
					.to(ib651_3_Type)
					.and(ib651_3_RawData)
					.complete();

				//complete packet
				var message = packetBuilder
					.withStart('AAAA')
					.withCommand(3)
					.withSerial(1)
					.withDeviceData(iscDeviceData)
					.withDeviceData(ib651_1_DeviceData)
					.withDeviceData(ib651_2_DeviceData)
					.withDeviceData(ib651_3_DeviceData)
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

							console.log(result);

							if (result == null || result.length == 0)
								return cb(new Error('Empty result!'));

							var isc = null,
								ib651_1 = null,
								ib651_2 = null,
								ib651_3 = null;

							result.forEach(x => {
								if (parseInt(x["p.serial"]) == 1 && x["p.type_id"] == 1)
									isc = x;

								if (parseInt(x["c.serial"]) == 1 && x["c.type_id"] == 2)
									ib651_1 = x;

								if (parseInt(x["c.serial"]) == 2 && x["c.type_id"] == 2)
									ib651_2 = x;

								if (parseInt(x["c.serial"]) == 3 && x["c.type_id"] == 2)
									ib651_3 = x;
							});

							cb(null, {
								isc: isc,
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

			//check communication status on each

			try {
				expect(result.isc["p.communication_status"]).to.equal(1);
				expect(result.ib651_1["c.communication_status"]).to.equal(1);

				//TODO: check this:
				// expect(result.ib651_1["c.window_id"]).to.equal(1);

				expect(result.ib651_2["c.communication_status"]).to.equal(1);

				//TODO: check this:
				//expect(result.ib651_2["c.window_id"]).to.equal(2);

				expect(result.ib651_3["c.communication_status"]).to.equal(1);

				//TODO: check this:
				//expect(result.ib651_3["c.window_id"]).to.equal(3);

				done();
			} catch (err) {
				done(err);
			}
		});
	});

	it('will ignore a data list with no data', function (done) {

		// aaaa080300011ae3
		// start - AAAA
		// length - 08
		// command - 03
		// serial - 0001
		// data - (empty)
		// crc - 1ae3

		async.waterfall([

			function (cb) {

				// set up the initial IBC with a single ISC via ping request (0x01)
				var initial = 'aaaa080300011ae3';

				serialPortHelper.sendMessage(initial)
					.then(function () {
						cb();
					})
					.catch(function (err) {
						console.log('port error: ', err);
						cb(err);
					});
			},
			function (cb) {
				setTimeout(function () {

					databaseHelper.getNodeTreeData(1, 1)
						.then(function (result) {
							cb(null, result);
						})
						.catch(function (err) {
							cb(err);
						});

				}, 5000);
			}
		], function (err, result) {

			if (err)
				return done(err);

			console.log(result.length);
			expect(result.length).to.equal(0);

			done();
		});
	});
});