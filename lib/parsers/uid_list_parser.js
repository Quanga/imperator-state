/**
 * Created by grant on 2016/08/23.
 */

function UidListParser(commandConstant) {
	this.__constant = commandConstant;
}

UidListParser.prototype.parse = function($happn, splitPacket) {
	const { error: logError, info: logInfo } = $happn.log;
	const PacketUtils = require("../utils/packet_utils");
	const utils = new PacketUtils();
	let resultArr = [];

	let buildNodeDataAsync = async () => {
		try {
			logInfo(":: EDD DATA LIST ::");

			let parent = utils.createPacketResult(
				splitPacket.complete,
				splitPacket.start,
				splitPacket.length,
				splitPacket.command,
				splitPacket.serial,
				null,
				splitPacket.crc,
				null,
				this.__constant.data.first_byte.parent_type
			);
			parent.window_id = 0;
			resultArr.push(parent);

			// now add the child list
			let dataMatch = splitPacket.data.match(/.{1,10}/g);

			for (let item of dataMatch) {
				let splitWindowData = utils.extractEddWindow(item);
				//console.log("EXTRACTING CHILD IN EDD LIST");
				let result = utils.createPacketResult(
					splitPacket.complete,
					splitPacket.start,
					splitPacket.length,
					splitPacket.command,
					splitWindowData.ip,
					null,
					splitPacket.crc,
					splitPacket.serial,
					this.__constant.data.remaining_bytes.parent_type,
					splitWindowData.window
				);
				resultArr.push(result);
			}

			return resultArr;
		} catch (err) {
			logError("parsing error", err);
		}
	};
	return buildNodeDataAsync();
};

UidListParser.prototype.buildNodeData = function($happn, parsedPacketArr) {
	const { error } = $happn.log;
	const PacketUtils = require("../utils/packet_utils");
	const utils = new PacketUtils();

	const buildNodeDataAsync = async () => {
		let resultArr = [];
		let bytePos = 0;

		try {
			for (const parsedPacket of parsedPacketArr) {
				let result = utils.createNodeResultObj();

				switch (bytePos) {
				case 0:
					result.serial = parseInt(parsedPacket.serial, 2);
					result.type_id = this.__constant.serial_type;
					result.parent_type = this.__constant.parent_type;
					result.window_id = parseInt(parsedPacket.windowId, 2); //update the window_id for a ping request to the number of nodes in the packet;
					break;
				case 1:
					result.type_id = this.__constant.data.first_byte.device_type;
					result.serial =
							result.type_id == 2
								? utils.reverseSerialBytes(parseInt(parsedPacket.serial, 2))
								: parseInt(parsedPacket.serial, 2);
					result.parent_serial = parseInt(parsedPacketArr[0].serial, 2);
					result.parent_type = this.__constant.data.first_byte.parent_type;
					result.window_id =
							parsedPacket.windowId != null
								? parseInt(parsedPacket.windowId, 2)
								: null;
					break;

				default:
					result.type_id = this.__constant.data.first_byte.device_type;
					result.serial =
							result.type_id == 2
								? utils.reverseSerialBytes(parseInt(parsedPacket.serial, 2))
								: parseInt(parsedPacket.serial, 2);
					result.parent_serial = parseInt(parsedPacketArr[0].serial, 2);
					result.parent_type = this.__constant.data.first_byte.parent_type;
					result.window_id =
							parsedPacket.windowId != null
								? parseInt(parsedPacket.windowId, 2)
								: null;
				}
				await resultArr.push(result);
				bytePos++;
			}
			return resultArr;
		} catch (err) {
			error("build nodedata error", err);
		}
	};

	return buildNodeDataAsync();
};

module.exports = UidListParser;
