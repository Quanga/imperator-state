/**
 * Created by grant on 2016/08/23.
 */

function DataParser(commandConstant) {
	this.__constant = commandConstant;
}

DataParser.prototype.parse = function ($happn, splitPacket, callback) {

	var resultArr = [];
	var self = this;

	var PacketUtils = require('../utils/packet_utils');
	var utils = new PacketUtils();

	try {
		$happn.log.info(':: data parser ::');

		//(packet, start, length, command, serial, data, crc, parent, parentType, pos)
		var result = utils.createPacketResult(splitPacket.complete, splitPacket.start, splitPacket.length,
			splitPacket.command, splitPacket.serial, splitPacket.data, splitPacket.crc, splitPacket.serial,
			self.__constant.serial_type);

		resultArr.push(result);

		callback(null, resultArr);

	} catch (err) {
		callback(err);
	}
};

DataParser.prototype.buildNodeData = function ($happn, parsedPacketArr, callback) {

	var self = this;
	var resultArr = [];
	var bytePos = 0;

	var PacketUtils = require('../utils/packet_utils');
	var utils = new PacketUtils();

	try {
		parsedPacketArr.forEach(function (parsedPacket) {

			var result = utils.createNodeResultObj();

			result.serial = parseInt(parsedPacket.serial, 2);
			utils.extractRawData(self.__constant, bytePos, parsedPacket, result);
			result.parent_serial = parseInt(parsedPacket.parentSerial, 2);
			result.type_id = self.__constant.data.first_byte.device_type;
			result.parent_type = self.__constant.data.first_byte.parent_type;

			resultArr.push(result);
			bytePos++;
		});

		$happn.log.info('parsed data items: ', resultArr);

		callback(null, resultArr);
	} catch (err) {
		callback(err);
	}
};

module.exports = DataParser;