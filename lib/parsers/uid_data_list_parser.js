/**
 * Created by grant on 2016/08/23.
 */

function DataListParser(commandConstant) {
    this.__constant = commandConstant
}

DataListParser.prototype.parse = function ($happn, splitPacket, callback) {

    var resultArr = [];
    var self = this;

    var PacketUtils = require('../utils/packet_utils');
    var utils = new PacketUtils();

    try {

        $happn.log.info(':: AB-1 data list parser ::');

        var count = 1;

        splitPacket.data.match(/.{1,8}/g).forEach(function (item) {

            //packet, start, length, command, serial, data, crc, parent, parentType, pos, delay

            var parentType = null;
            if (count == 1){
				var splitDataDelayWindow = utils.extractAB1Data(item);
                parentType = self.__constant.data.first_byte.parent_type;
				resultArr.push(utils.createPacketResult(splitPacket.complete, splitPacket.start, splitPacket.length,
					splitPacket.command, splitPacket.serial, splitDataDelayWindow.AB1Data, splitPacket.crc, null, parentType, 0, splitDataDelayWindow.crc));
			}
            else{
				var splitDataDelayWindow = utils.extractUidData(item);
                parentType = self.__constant.data.remaining_bytes.parent_type;
				resultArr.push(utils.createPacketResult(splitPacket.complete, splitPacket.start, splitPacket.length,
					splitPacket.command, splitPacket.serial, splitDataDelayWindow.uidData, splitPacket.crc, null, parentType, splitDataDelayWindow.window, splitDataDelayWindow.delay));
			}
            count++;
        });

        //$happn.log.info('>>> DATA ITEMS: ' + JSON.stringify(resultArr));

        callback(null, resultArr);

    } catch (err) {
        $happn.log.info(err);
        callback(err);
    }
};

DataListParser.prototype.buildNodeData = function ($happn, parsedPacketArr, callback) {

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
                    result.type_id = self.__constant.data.first_byte.device_type;
                    result.parent_type = self.__constant.data.first_byte.parent_type;
					result.crc = parseInt(parsedPacket.data2, 2);
                    break;
                default:
                    // NOTE: serial is unknown for the remaining bytes!
                    result.type_id = self.__constant.data.remaining_bytes.device_type;
                    result.parent_serial = parseInt(parsedPacketArr[0].serial, 2);
					result.delay = utils.reverseSerialBytes(parseInt(parsedPacket.data2, 2));
                    result.parent_type = self.__constant.data.remaining_bytes.parent_type;
					result.window_id = parseInt(parsedPacket.windowId,2);
            }
            utils.extractRawData(self.__constant, bytePos, parsedPacket, result);
            resultArr.push(result);
            bytePos++;
        });
		console.log(resultArr);
        callback(null, resultArr);
    } catch (err) {
        callback(err);
    }
};

module.exports = DataListParser;