/**
 * Created by grant on 2016/10/25.
 */

var PacketBuilder = require("../builders/packet_builder");
var StringBuilder = require("../builders/string_builder");

function PacketSimulatorService() {}

PacketSimulatorService.prototype.initialise = function($happn, callback) {
	var self = this;
	var async = require("async");

	if ($happn.config.enabled != "true") return callback();

	setInterval(function() {
		async.waterfall(
			[
				function(cb) {
					self
						.__generateTestData()
						.then(function(result) {
							self.__tree = result;
							cb();
						})
						.catch(function(err) {
							cb(err);
						});
				},
				function(cb1) {
					var iscList = self.__generateSerialListPacket(self.__tree); //generate isc serial list for the ibc
					cb1(null, iscList);
				},
				function(iscList, cb2) {
					//self.__insertData($happn, iscList)
					self.__parseAndAddToQueue($happn, iscList, function(err) {
						if (err) return cb2(err);
						cb2();
					});
				},
				function(cb3) {
					self.__tree.children.forEach(function(child) {
						var ib651List = self.__generateSerialListPacket(child); // generate ib651 serial list for each isc

						//self.__insertData($happn, ib651List)
						self.__parseAndAddToQueue($happn, ib651List, function(err) {
							if (err) return cb3(err);

							var ib651DataList = self.__generateDataListPacket(child); // generate ib651 data list for each isc

							//self.__insertData($happn, ib651DataList)
							self.__parseAndAddToQueue($happn, ib651DataList, function(err) {
								if (err) return cb3(err);

								//cb3();
							});
						});
					});

					cb3();
				}
			],
			function(err) {
				if (err) $happn.log.error(err);
			}
		);
	}, $happn.config.generateDataInterval);

	callback();
};

PacketSimulatorService.prototype.__insertData = function($happn, packet) {
	var async = require("async");

	return new Promise(function(resolve, reject) {
		async.waterfall(
			[
				function(cb1) {
					$happn.exchange.packetService
						.extractData(packet)
						.then(function(parsedPacket) {
							// console.log(
							// 	"## SIMULATED PARSED PACKET DATA:::: " +
							// 		JSON.stringify(parsedPacket)
							// );
							cb1(null, parsedPacket);
						})
						.catch(function(err) {
							cb1("cb1 error: " + err);
						});
				},
				function(parsedPacket, cb2) {
					$happn.log.info("building node data...");
					$happn.exchange.packetService
						.buildNodeData(parsedPacket)
						.then(function(nodeData) {
							// console.log(
							// 	"## SIMULATED PARSED NODE DATA:::: " + JSON.stringify(nodeData)
							// );
							cb2(null, nodeData);
						})
						.catch(function(err) {
							cb2("cb2 error: " + err);
						});
				},
				function(nodeData, cb3) {
					$happn.log.info("inserting node data...");
					$happn.exchange.dataService
						.upsertNodeDataArr(nodeData)
						.then(function() {
							$happn.log.info("node data inserted...");
							cb3();
						})
						.catch(function(err) {
							$happn.log.error("cb3 error: " + err);
							cb3("cb3 error: " + err);
						});
				}
			],
			function(err, result) {
				if (err) return reject(err);

				resolve(result);
			}
		);
	});
};

PacketSimulatorService.prototype.__generateTestData = function() {
	var self = this;

	return new Promise(function(resolve, reject) {
		try {
			var x = 0;
			var ids = [];

			while (x < 100) {
				var result = Math.floor(Math.random() * 100 + 1);
				if (!ids.includes(result)) {
					ids.push(result);
					x++;
				}
			}

			var ibc = {
				type: "ibc",
				children: [],
				//id: ids.pop(),
				serial: ids.pop(),
				data: [0, 0, 0, 0, 0, 0, self.__getRandomBit(), 0]
			};

			for (var y = 0; y < 5; y++) {
				//isc's
				var isc = {
					type: "isc",
					children: [],
					//id: ids.pop(),
					serial: ids.pop(),
					data: [0, 0, 0, 0, 0, 0, self.__getRandomBit(), 0]
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

			resolve(ibc);
		} catch (err) {
			reject(err);
		}
	});
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
	var stringBuilder = new StringBuilder();
	var packetBuilder = new PacketBuilder();

	var command = 3;

	packetBuilder
		.withStart("AAAA")
		.withCommand(command)
		.withSerial(isc.serial);

	var parentDeviceId = packetBuilder.createDeviceIdData(1);
	var parentDeviceType = packetBuilder.createDeviceTypeData(1); // ISC is type id 1
	var parentRawData = packetBuilder.createRawData(isc.data);

	var parentDeviceData = stringBuilder
		.append(parentDeviceId)
		.to(parentDeviceType)
		.and(parentRawData)
		.complete();

	packetBuilder.withDeviceData(parentDeviceData);

	isc.children.forEach(function(child) {
		var deviceId = packetBuilder.createDeviceIdData(child.serial);
		var deviceType = packetBuilder.createDeviceTypeData(2); // IB651 is type id 2
		var rawData = packetBuilder.createRawData(child.data);

		var deviceData = stringBuilder
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
	message,
	callback
) {
	// parse the message
	$happn.exchange.packetService
		.parseBinaryMessage(message)

		.then(function(parsedMessage) {
			// all ok - add to the queue
			$happn.exchange.queueService
				.addToIncomingQueue(parsedMessage)
				.then(function(result) {
					//$happn.log.info("SIMULATOR: message added to queue: " + result);
					return callback();
				})
				.catch(function(err) {
					//$happn.log.error("SIMULATOR: error adding message to queue", err);
					return callback(err);
				});
		})
		.catch(function(err) {
			$happn.log.error("SIMULATOR ERROR: ", err);
			return callback(err);
		});
};

module.exports = PacketSimulatorService;
