//const expect = require("expect.js");

describe("Benchmark tests", function() {
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

	const SerailPortService = require("../../lib/services/serial_port_service");
	let serialPortService = new SerailPortService();

	const MockHappn = require("../mocks/mock_happn");
	let mockHappn = null;

	this.timeout(10000);

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

	it("can process 1000 items in the queue", function(done) {
		const PacketBuilder = require("../../lib/builders/packet_builder");
		const packetBuilder = new PacketBuilder();
		const StringBuilder = require("../../lib/builders/string_builder");
		const stringBuilder = new StringBuilder();

		//let setupData = async function() {
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

		console.log("sending messages");

		let loop = async function() {
			for (let i = 0; i < 200; i++) {
				const res = await serialPortHelper.sendMessage(message);
				console.log(`sending message ${res} -- ${i}`);
			}
			console.log("LOOOOP COMPLETE");
		};

		//loop();
		//};
		let ende = function() {
			console.log("finishing");
		};

		loop()
			.then(setTimeout(ende, 1000))
			.then(done())
			.catch(err => done(err));
	});
});
