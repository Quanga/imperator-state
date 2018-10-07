/**
 * Created by grant on 2016/08/23.
 */

function SerialListParser(commandConstant) {
	this.__constant = commandConstant;
}

SerialListParser.prototype.parse = function($happn, splitPacket) {
	let resultArr = [];
	let pos = 0;

	const PacketUtils = require("../utils/packet_utils");
	var utils = new PacketUtils();

	let parseAsync = async () => {
		$happn.log.info(":: serial list parser ::");

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

			// now add the child list
			let splitArray = splitPacket.data.match(/.{1,4}/g);
			for (const packet of splitArray) {
				pos++;

				var result = await utils.createPacketResult(
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

			resultArr[0].window_id = pos; //update the parent's window_id for a ping request to the number of nodes in the packet;

			return resultArr;
		} catch (err) {
			$happn.log.error("parsing error");
		}
	};

	return parseAsync();
};

SerialListParser.prototype.buildNodeData = function($happn, parsedPacketArr) {
	var PacketUtils = require("../utils/packet_utils");
	var utils = new PacketUtils();

	var resultArr = [];
	var bytePos = 0;

	let buildNodeDataAsync = async () => {
		try {
			for (const parsedPacket of parsedPacketArr) {
				var result = utils.createNodeResultObj();

				switch (bytePos) {
				case 0:
					result.serial = parseInt(parsedPacket.serial, 2);
					result.type_id = this.__constant.serial_type;
					result.parent_type = this.__constant.parent_type;
					result.window_id = parseInt(parsedPacket.window_id); //update the window_id for a ping request to the number of nodes in the packet;
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

				await resultArr.push(result);
				bytePos++;
			}

			return resultArr;
		} catch (err) {
			$happn.log.error("build nodedata error", err);
		}
	};

	return buildNodeDataAsync();
};

module.exports = SerialListParser;
