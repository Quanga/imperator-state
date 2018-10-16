/**
 * Created by grant on 2016/10/25.
 */

function PacketSimulatorService() {}

const PacketBuilder = require("../builders/packet_builder");
const StringBuilder = require("../builders/string_builder");

let timer = ms => {
	return new Promise(resolve => setTimeout(resolve, ms));
};

PacketSimulatorService.prototype.initialise = function($happn) {
	const { config } = $happn;
	if (config.enabled != "true") return;
	let init = async () => {
		//await fileHelper.clearQueueFiles();
		//await databaseHelper.clearDatabase();
		await timer(1000);
	};

	let packetCycleAsync = async () => {
		let self = this;
		try {
			self.__tree = await self.__generateTestData();
			let iscList = self.__generateSerialListPacket(self.__tree); //generate isc serial list for the ibc
			await self.__parseAndAddToQueue($happn, iscList);

			self.__tree.children.forEach(function(child) {
				let ib651List = self.__generateSerialListPacket(child); // generate ib651 serial list for each isc

				//self.__insertData($happn, ib651List)
				self.__parseAndAddToQueue($happn, ib651List);

				let ib651DataList = self.__generateDataListPacket(child); // generate ib651 data list for each isc

				//self.__insertData($happn, ib651DataList)
				self.__parseAndAddToQueue($happn, ib651DataList);
			});

			await timer(config.generateDataInterval);
			packetCycleAsync();
		} catch (err) {
			$happn.log.error("packet sim error", err);
		}
	};

	init().then(() => {
		return packetCycleAsync();
	});
};

PacketSimulatorService.prototype.__insertData = function($happn, packet) {
	const { packetService, dataService } = $happn.exchange;
	const { info: logInfo, error: logError } = $happn.log;

	let insertDataAsync = async () => {
		try {
			let parsedPacket = await packetService.extractData(packet);
			logInfo("building node data...");
			let nodeData = await packetService.buildNodeData(parsedPacket);
			logInfo("inserting node data...");
			await dataService.upsertNodeDataArr(nodeData);
			logInfo("node data inserted...");
		} catch (err) {
			logError("inserting node data..error", err);
		}
	};

	return insertDataAsync();
};

PacketSimulatorService.prototype.__generateTestData = function() {
	let generateTestDataAsync = async () => {
		try {
			let x = 0;
			let ids = [];

			while (x < 100) {
				var result = Math.floor(Math.random() * 100 + 1);
				if (!ids.includes(result)) {
					ids.push(result);
					x++;
				}
			}

			let ibc = {
				type: "ibc",
				children: [],
				//id: ids.pop(),
				serial: ids.pop(),
				data: [0, 0, 0, 0, 0, 0, this.__getRandomBit(), 0]
			};

			for (var y = 0; y < 5; y++) {
				//isc's
				var isc = {
					type: "isc",
					children: [],
					//id: ids.pop(),
					serial: ids.pop(),
					data: [0, 0, 0, 0, 0, 0, this.__getRandomBit(), 0]
				};

				var randomSize = Math.floor(Math.random() * (10 - 2 + 1)) + 2;

				for (var z = 0; z < randomSize; z++) {
					// ib651's
					var ib651 = {
						type: "ib651",
						//id: ids.pop(),
						serial: ids.pop(),
						data: [0, 0, 0, 0, 0, 0, 0, 0]
					};

					isc.children.push(ib651);
				}

				ibc.children.push(isc);
			}

			return ibc;
		} catch (err) {
			console.log(err);
		}
	};

	return generateTestDataAsync();
};

PacketSimulatorService.prototype.__generateDataPacket = function(device) {
	var packetBuilder = new PacketBuilder();
	var stringBuilder = new StringBuilder();

	var command = 8; // default data of the IBC

	packetBuilder
		.withStart("AAAA")
		.withCommand(command)
		.withSerial(device.serial);

	var deviceId = packetBuilder.createDeviceIdData(device.id);
	var deviceType = packetBuilder.createDeviceTypeData(2); // not sure about this - this type is actually ib651
	var rawData = packetBuilder.createRawData([0, 0, 0, 0, 0, 0, 0, 0]);

	var deviceData = stringBuilder
		.append(deviceId)
		.to(deviceType)
		.and(rawData)
		.complete();

	return packetBuilder.withDeviceData(deviceData).build();
};

PacketSimulatorService.prototype.__getRandomBit = function() {
	return Math.round(Math.random());
};

PacketSimulatorService.prototype.__generateSerialListPacket = function(device) {
	var packetBuilder = new PacketBuilder();

	var command = device.type == "ibc" ? 1 : 2; // if device is ibc then 1 is the ISC list; otherwise 2 is the IB651 list

	packetBuilder
		.withStart("AAAA")
		.withCommand(command)
		.withSerial(device.serial);

	device.children.forEach(function(child) {
		packetBuilder.withSerialData(child.serial);
	});

	return packetBuilder.build();
};

PacketSimulatorService.prototype.__generateDataListPacket = function(isc) {
	const stringBuilder = new StringBuilder();
	const packetBuilder = new PacketBuilder();

	let command = 3;

	packetBuilder
		.withStart("AAAA")
		.withCommand(command)
		.withSerial(isc.serial);

	let parentDeviceId = packetBuilder.createDeviceIdData(1);
	let parentDeviceType = packetBuilder.createDeviceTypeData(1); // ISC is type id 1
	let parentRawData = packetBuilder.createRawData(isc.data);

	let parentDeviceData = stringBuilder
		.append(parentDeviceId)
		.to(parentDeviceType)
		.and(parentRawData)
		.complete();

	packetBuilder.withDeviceData(parentDeviceData);

	isc.children.forEach(function(child) {
		let deviceId = packetBuilder.createDeviceIdData(child.serial);
		let deviceType = packetBuilder.createDeviceTypeData(2); // IB651 is type id 2
		let rawData = packetBuilder.createRawData(child.data);

		let deviceData = stringBuilder
			.append(deviceId)
			.to(deviceType)
			.and(rawData)
			.complete();

		packetBuilder.withDeviceData(deviceData);
	});

	return packetBuilder.build();
};

PacketSimulatorService.prototype.__parseAndAddToQueue = function(
	$happn,
	message
) {
	const { packetService, queueService } = $happn.exchange;

	let parseAndAddToQAsync = async () => {
		try {
			// parse the message
			let parsedMessage = await packetService.parseBinaryMessage(message);
			queueService.addToIncomingQueue(parsedMessage);
		} catch (err) {
			$happn.log.error("SIMULATOR ERROR: ", err);
		}
	};
	return parseAndAddToQAsync();
};

module.exports = PacketSimulatorService;
