/**
 * Created by grant on 2016/08/23.
 */

function UidListParser(commandConstant) {
	this.__constant = commandConstant;
}

UidListParser.prototype.parse = function ($happn, splitPacket, callback) {

	var resultArr = [];
	var self = this;
	var pos = 0;

	var PacketUtils = require('../utils/packet_utils');
	var utils = new PacketUtils();

	try {
		$happn.log.info(':: UID list parser ::');

		// create the parent (we don't know what the parent id of the parent is)
		var parent = utils.createPacketResult(splitPacket.complete, splitPacket.start, splitPacket.length,
			splitPacket.command, splitPacket.serial, null, splitPacket.crc, null, self.__constant.data.first_byte.parent_type);
		parent.window_id = 0;
		resultArr.push(parent);

		// now add the child list
		splitPacket.data.match(/.{1,10}/g).forEach(function (item) {
			pos++;
			var splitWindowData = utils.extractUidWindow(item);
			var result = utils.createPacketResult(splitPacket.complete, splitPacket.start, splitPacket.length,
				splitPacket.command, splitWindowData.ip, null, splitPacket.crc, splitPacket.serial, self.__constant.data.remaining_bytes.parent_type, splitWindowData.window);
			resultArr.push(result);
			console.log(result);
		});


		$happn.log.info('--> parsed UID list: ' + JSON.stringify(resultArr));

		callback(null, resultArr);

	} catch (err) {
		callback(err);
	}

};

UidListParser.prototype.buildNodeData = function ($happn, parsedPacketArr, callback) {

	var self = this;
	var resultArr = [];
	var bytePos = 0;

	var PacketUtils = require('../utils/packet_utils');
	var utils = new PacketUtils();

	try {
		parsedPacketArr.forEach(function (parsedPacket) {

			var result = utils.createNodeResultObj();

			switch (bytePos) {
			case 0:
				result.serial = parseInt(parsedPacket.serial, 2);
				result.type_id = self.__constant.serial_type;
				result.parent_type = self.__constant.parent_type;
				result.window_id = parseInt(parsedPacket.window_id); //update the window_id for a ping request to the number of nodes in the packet;
				break;
			case 1:
				result.type_id = self.__constant.data.first_byte.device_type;
				result.serial = result.type_id == 2 ? utils.reverseSerialBytes(parseInt(parsedPacket.serial, 2)) : parseInt(parsedPacket.serial, 2);
				result.parent_serial = parseInt(parsedPacketArr[0].serial, 2);
				result.parent_type = self.__constant.data.first_byte.parent_type;
				result.window_id = parsedPacket.windowId != null ? parseInt(parsedPacket.windowId, 2) : null;
				break;
			default:
				result.type_id = self.__constant.data.first_byte.device_type;
				result.serial = result.type_id == 2 ? utils.reverseSerialBytes(parseInt(parsedPacket.serial, 2)) : parseInt(parsedPacket.serial, 2);
				result.parent_serial = parseInt(parsedPacketArr[0].serial, 2);
				result.parent_type = self.__constant.data.first_byte.parent_type;
				result.window_id = parsedPacket.windowId != null ? parseInt(parsedPacket.windowId, 2) : null;
			}
			resultArr.push(result);
			bytePos++;
		});
		callback(null, resultArr);
	} catch (err) {
		callback(err);
	}
};

module.exports = UidListParser;