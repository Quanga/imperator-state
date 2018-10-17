/**
 * Created by grant on 2016/08/23.
 */

function SerialListParser(commandConstant) {
	this.__constant = commandConstant;
}

const PacketUtils = require("../utils/packet_utils");

SerialListParser.prototype.parse = function($happn, splitPacket) {
	const { info: logInfo, error: logError } = $happn.log;
	const utils = new PacketUtils();

	let resultArr = [];

	let parseAsync = async () => {
		logInfo(":: serial list parser ::");

		// create the parent (we don't know what the parent id of the parent is)
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

		try {
			await resultArr.push(parent);

			if (splitPacket.data == "") {
				return resultArr;
			}

			let pos = 0;

			// now add the child list
			let splitArray = splitPacket.data.match(/.{1,4}/g);
			for (const packet of splitArray) {
				pos++;

				let result = utils.createPacketResult(
					splitPacket.complete,
					splitPacket.start,
					splitPacket.length,
					splitPacket.command,
					packet,
					null,
					splitPacket.crc,
					splitPacket.serial,
					this.__constant.data.remaining_bytes.parent_type,
					pos
				);

				if (utils.checkForNoDuplicate(resultArr, result)) {
					resultArr.push(result);
				}
			}

			resultArr[0].windowId = pos; //update the parent's window_id for a ping request to the number of nodes in the packet;

			return resultArr;
		} catch (err) {
			logError("parsing error", err);
		}
	};

	return parseAsync();
};

SerialListParser.prototype.buildNodeData = function($happn, parsedPacketArr) {
	const { error } = $happn.log;
	const utils = new PacketUtils();

	let resultArr = [];
	let bytePos = 0;

	const buildNodeDataAsync = async () => {
		try {
			for (const parsedPacket of parsedPacketArr) {
				let result = utils.createNodeResultObj();

				switch (bytePos) {
				case 0:
					result.serial = parseInt(parsedPacket.serial, 2);
					result.type_id = this.__constant.serial_type;
					result.parent_type = this.__constant.parent_type;
					//console.log("WIINDOW ID - ", parsedPacket.windowId);

					result.window_id = parsedPacket.windowId; //update the window_id for a ping request to the number of nodes in the packet;
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
								? parseInt(parsedPacket.windowId)
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
								? parseInt(parsedPacket.windowId)
								: null;
				}
				bytePos++;

				await resultArr.push(result);
			}

			return resultArr;
		} catch (err) {
			error("build nodedata error", err);
		}
	};

	return buildNodeDataAsync();
};

module.exports = SerialListParser;
