/**
 * Created by grant on 2016/08/23.
 */

function SerialListParser(commandConstant) {
    this.__constant = commandConstant;
}

SerialListParser.prototype.parse = function ($happn, splitPacket, callback) {

    var resultArr = [];
    var self = this;
    var pos = 0;

    var PacketUtils = require('../utils/packet_utils');
    var utils = new PacketUtils();

    try {
        $happn.log.info(':: serial list parser ::');

        // create the parent (we don't know what the parent id of the parent is)
        var parent = utils.createPacketResult(splitPacket.complete, splitPacket.start, splitPacket.length,
            splitPacket.command, splitPacket.serial, null, splitPacket.crc, null, self.__constant.data.first_byte.parent_type);

        resultArr.push(parent);

        if (splitPacket.data == '')
            return callback(null, resultArr);

        // now add the child list
        splitPacket.data.match(/.{1,4}/g).forEach(function (item) {

            pos++;

            var result = utils.createPacketResult(splitPacket.complete, splitPacket.start, splitPacket.length,
                splitPacket.command, item, null, splitPacket.crc, splitPacket.serial, self.__constant.data.remaining_bytes.parent_type, pos);
				
			if(utils.checkForNoDuplicate(resultArr,result)){
				resultArr.push(result);
			}

            
        });

        resultArr[0].window_id = pos;   //update the parent's window_id for a ping request to the number of nodes in the packet;

        //$happn.log.info('--> parsed serial list: ' + JSON.stringify(resultArr));

        callback(null, resultArr);

    } catch (err) {
        callback(err);
    }

};

SerialListParser.prototype.buildNodeData = function ($happn, parsedPacketArr, callback) {

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
					result.window_id = parseInt(parsedPacket.window_id)				//update the window_id for a ping request to the number of nodes in the packet;
                    break;
                case 1:
                    result.type_id = self.__constant.data.first_byte.device_type;
                    result.serial = result.type_id == 2 ? utils.reverseSerialBytes(parseInt(parsedPacket.serial, 2)) : parseInt(parsedPacket.serial, 2);
                    result.parent_serial = parseInt(parsedPacketArr[0].serial, 2);
                    result.parent_type = self.__constant.data.first_byte.parent_type;
                    result.window_id = parsedPacket.windowId != null ? parseInt(parsedPacket.windowId) : null;
                    break;
                default:
                    result.type_id = self.__constant.data.first_byte.device_type;
                    result.serial = result.type_id == 2 ? utils.reverseSerialBytes(parseInt(parsedPacket.serial, 2)) : parseInt(parsedPacket.serial, 2);
                    result.parent_serial = parseInt(parsedPacketArr[0].serial, 2);
                    result.parent_type = self.__constant.data.first_byte.parent_type;
                    result.window_id = parsedPacket.windowId != null ? parseInt(parsedPacket.windowId) : null;
            }

            resultArr.push(result);
            bytePos++;
        });

        $happn.log.info('parsed serial list items: ', resultArr);

        callback(null, resultArr);
    } catch (err) {
        callback(err);
    }
};

module.exports = SerialListParser;