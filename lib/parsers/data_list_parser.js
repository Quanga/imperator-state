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

        $happn.log.info(':: data list parser ::');

        var count = 1;

        if (splitPacket.data == '')
            return callback(null, resultArr);

        splitPacket.data.match(/.{1,4}/g).forEach(function (item) {

            //packet, start, length, command, serial, data, crc, parent, parentType

            var parentType = null;

            if (count == 1)
                parentType = self.__constant.data.first_byte.parent_type;
            else
                parentType = self.__constant.data.remaining_bytes.parent_type;

            var resultItem = utils.createPacketResult(splitPacket.complete, splitPacket.start, splitPacket.length,
                splitPacket.command, splitPacket.serial, item, splitPacket.crc, null, parentType);

            $happn.log.info('CMD:' + resultItem.command + ' ID:' + resultItem.data.deviceId + ' raw:' + resultItem.data.raw);

            if ((resultItem.data.raw[0] == '1') || (resultItem.data.raw[1] == '1') || (resultItem.data.raw[2] == '1') || (resultItem.data.raw[3] == '1') ||
                (resultItem.data.raw[4] == '1') || (resultItem.data.raw[5] == '1') || (resultItem.data.raw[6] == '1') || (resultItem.data.raw[7] == '1'))
                resultArr.push(resultItem);
            else
                $happn.log.info('Invalid data detected and ignored!');

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
                    break;
                default:
                    // NOTE: serial is unknown for the remaining bytes!
                    result.type_id = self.__constant.data.remaining_bytes.device_type;
                    result.parent_serial = parseInt(parsedPacketArr[0].serial, 2);
                    result.parent_type = self.__constant.data.remaining_bytes.parent_type;
            }

            utils.extractRawData(self.__constant, bytePos, parsedPacket, result);

            resultArr.push(result);
            bytePos++;
        });

        $happn.log.info('parsed data list items: ', resultArr);

        callback(null, resultArr);
    } catch (err) {
        callback(err);
    }
};

module.exports = DataListParser;