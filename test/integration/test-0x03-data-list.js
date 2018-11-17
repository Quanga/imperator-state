const expect = require("expect.js");

describe("parser-ib651-parser-test", function() {
	const ServerHelper = require("../helpers/server_helper");
	let serverHelper = new ServerHelper();

	const DatabaseHelper = require("../helpers/database_helper");
	let databaseHelper = new DatabaseHelper();

	const FileHelper = require("../helpers/file_helper");
	let fileHelper = new FileHelper();

	const SerialPortHelper = require("../helpers/serial_port_helper");
	let serialPortHelper = new SerialPortHelper();

	var PacketBuilder = require("../../lib/builders/packet_builder");
	var StringBuilder = require("../../lib/builders/string_builder");

	let timer = ms => {
		return new Promise(resolve => setTimeout(resolve, ms));
	};

	this.timeout(30000);

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
		serverHelper.stopServer();
	});

	it.only("can send a data list request containing one ISC with IB651s 1, 2 & 3", async function() {
		// AAAA100300014030212022402310(CRC)
		// start - AAAA
		// length - 10
		// command - 03
		// serial - 0001
		// data - 4030 2120 2240 2310 (data for IB651s)
		// crc - ?

		let packetBuilder = new PacketBuilder();
		let stringBuilder = new StringBuilder();

		let step1 = async () => {
			// set up the initial IBC with a single ISC via ping request (0x01)
			let initial = packetBuilder
				.withStart("AAAA")
				.withCommand(2)
				.withSerial(1)
				.withSerialData(256)
				.build();

			await serialPortHelper.sendMessage(initial);

			packetBuilder.reset();

			await timer(3000);
			//now set up the IB651's via ping request (0x02)

			let initial2 = packetBuilder
				.withStart("AAAA")
				.withCommand(2)
				.withSerial(1)
				.withSerialData(256)
				.withSerialData(512)
				.withSerialData(768)
				.build();

			await serialPortHelper.sendMessage(initial2);
			await timer(1000);

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
			let iscDeviceId = packetBuilder.createDeviceIdData(1);
			let iscDeviceType = packetBuilder.createDeviceTypeData(1); // ISC is type id 1
			let iscRawData = packetBuilder.createRawData([0, 0, 0, 0, 0, 1, 0, 0]); // 30 hex = 00001100 bin (little endian)
			//let iscRawData = packetBuilder.createRawData([1, 1, 1, 1, 1, 1, 1, 1]); // 30 hex = 00001100 bin (little endian)

			let iscDeviceData = stringBuilder
				.append(iscDeviceType)
				.to(iscRawData)
				.and(iscDeviceId)
				.complete();

			//IB651 # 1 data
			let ib651_1_Id = packetBuilder.createDeviceIdData(0);
			let ib651_1_Type = packetBuilder.createDeviceTypeData(2); // IB651 is type id 2
			let ib651_1_RawData = packetBuilder.createRawData([
				1,
				1,
				1,
				1,
				1,
				1,
				1,
				1
			]); //20 hex = 00000100 binary (little endian)

			let stringBuilder2 = new StringBuilder();

			let ib651_1_DeviceData = stringBuilder2
				.append(ib651_1_Type)
				.to(ib651_1_RawData)
				.and(ib651_1_Id)
				.complete();

			//IB651 # 2 data
			let ib651_2_Id = packetBuilder.createDeviceIdData(2);
			let ib651_2_Type = packetBuilder.createDeviceTypeData(2); // IB651 is type id 2
			let ib651_2_RawData = packetBuilder.createRawData([
				0,
				0,
				0,
				0,
				0,
				0,
				1,
				0
			]); //40 hex = 00000010 binary (little endian)

			let stringBuilder3 = new StringBuilder();

			let ib651_2_DeviceData = stringBuilder3
				.append(ib651_2_Type)
				.to(ib651_2_RawData)
				.and(ib651_2_Id)
				.complete();

			//IB651 # 3 data
			let ib651_3_Id = packetBuilder.createDeviceIdData(3);
			let ib651_3_Type = packetBuilder.createDeviceTypeData(2); // IB651 is type id 2
			let ib651_3_RawData = packetBuilder.createRawData([
				1,
				1,
				1,
				1,
				1,
				1,
				1,
				1
			]); // 10 hex = 00001000 binary (little endian)

			let ib651_3_DeviceData = stringBuilder
				.append(ib651_3_Type)
				.to(ib651_3_RawData)
				.and(ib651_3_Id)
				.complete();

			//complete packet
			let finalmessage = packetBuilder
				.withStart("AAAA")
				.withCommand(3)
				.withSerial(1)
				.withDeviceData(iscDeviceData)
				.withDeviceData(ib651_1_DeviceData)
				.withDeviceData(ib651_2_DeviceData)
				.withDeviceData(ib651_3_DeviceData)
				.build();
			await timer(2000);

			await serialPortHelper.sendMessage(finalmessage);
		};

		let step2 = async () => {
			try {
				let result = await databaseHelper.getNodeTreeData(1, 1);

				if (result == null || result.length == 0)
					return new Error("Empty result!");

				var isc = null,
					ib651_1 = null,
					ib651_2 = null,
					ib651_3 = null;

				result.forEach(x => {
					if (parseInt(x["p.serial"]) == 1 && x["p.type_id"] == 1) isc = x;
					if (parseInt(x["c.serial"]) == 1 && x["c.type_id"] == 2) ib651_1 = x;
					if (parseInt(x["c.serial"]) == 2 && x["c.type_id"] == 2) ib651_2 = x;
					if (parseInt(x["c.serial"]) == 3 && x["c.type_id"] == 2) ib651_3 = x;
				});

				return {
					isc: isc,
					ib651_1: ib651_1,
					ib651_2: ib651_2,
					ib651_3: ib651_3
				};
			} catch (err) {
				return Promise.reject(err);
			}
		};

		let step3 = async result => {
			try {
				//check communication status on each

				expect(result.isc["p.communication_status"]).to.equal(1);
				expect(result.ib651_1["c.communication_status"]).to.equal(1);
				expect(result.ib651_1["c.communication_status"]).to.equal(1);

				//TODO: check this:
				// expect(result.ib651_1["c.window_id"]).to.equal(1);
				expect(result.ib651_2["c.communication_status"]).to.equal(1);

				//TODO: check this:
				//expect(result.ib651_2["c.window_id"]).to.equal(2);
				expect(result.ib651_3["c.communication_status"]).to.equal(1);

				//TODO: check this:
				//expect(result.ib651_3["c.window_id"]).to.equal(3);
			} catch (err) {
				return Promise.reject(err);
			}
		};

		let test = async () => {
			try {
				await timer(3500);
				await step1();
				await timer(6000);
				let result = await step2();
				await step3(result);
			} catch (err) {
				return Promise.reject(err);
			}
		};

		return test();
	});

	it.only("will ignore a data list with no data", async function() {
		// aaaa080300011ae3
		// start - AAAA
		// length - 08
		// command - 03
		// serial - 0001
		// data - (empty)
		// crc - 1ae3
		let step1 = async () => {
			var initial = "aaaa080300011ae3";

			await serialPortHelper.sendMessage(initial);
		};

		let step2 = async () => {
			let results = await databaseHelper.getNodeTreeData(1, 1);
			return results;
		};

		let test = async () => {
			try {
				await timer(3500);

				await step1();
				await timer(3500);

				let result = await step2();
				expect(result.length).to.equal(0);
			} catch (err) {
				return Promise.reject(err);
			}
		};

		return test();
	});
});
