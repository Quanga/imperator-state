//const expect = require("expect.js");

describe("Benchmark tests", function() {
	const ServerHelper = require("../helpers/server_helper");
	const serverHelper = new ServerHelper();

	const DatabaseHelper = require("../helpers/database_helper");
	const databaseHelper = new DatabaseHelper();

	const FileHelper = require("../helpers/file_helper");
	const fileHelper = new FileHelper();

	const SerialPortHelper = require("../helpers/serial_port_helper");
	const serialPortHelper = new SerialPortHelper();

	before("cleaning up queues", async function() {
		await fileHelper.clearQueueFiles();
	});

	before("start test server", async function() {
		await serverHelper.startServer();
	});

	beforeEach("cleaning up db", async function() {
		try {
			await databaseHelper.clearDatabase();
		} catch (err) {
			return Promise.reject(err);
		}
	});

	after("stop test server", async function() {
		await serverHelper.stopServer();
	});

	this.timeout(20000);

	let timer = ms => {
		return new Promise(resolve => setTimeout(resolve, ms));
	};

	it("can process 1000 items in the queue", async function() {
		const PacketBuilder = require("../../lib/builders/packet_builder");
		const packetBuilder = new PacketBuilder();
		const StringBuilder = require("../../lib/builders/string_builder");
		const stringBuilder = new StringBuilder();

		let step1 = async () => {
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

			for (let i = 0; i < 1000; i++) {
				// const res = await serialPortHelper.sendMessage(
				// 	"aaaa4805004364000a291f01b80b20011c0c2101800c2201e40c2301480d2401ac0d2501100e2601740e2701d80e28013c0f2901a00f2a0104102b0168102c01cc102d0130114a5d"
				// );

				const res = await serialPortHelper.sendMessage(message);
				console.log(`sending message ${res} -- ${i}`);
			}
			console.log("LOOOOP COMPLETE");
		};

		let test = async () => {
			try {
				await timer(4500);
				await step1();
				await timer(10000);
			} catch (err) {
				Promise.reject(err);
			}
		};

		return test();
	});
});
