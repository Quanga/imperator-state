/**
 * Created by grant on 2016/06/22.
 */

function PacketService() {}
const PacketUtils = require("../utils/packet_utils");

/***
 * @summary Parse Binary data and return converted message once the
 * CRC has qualified
 * Incoming form the MESSAGE HANDLER
 * @param $happn
 * @param data - the incoming data
 */
PacketService.prototype.parseBinaryMessage = function($happn, data) {
	let parseBinaryAsync = async () => {
		try {
			let message = data.toString("hex");
			$happn.log.info("checking CRC in message: ", message);

			let utils = new PacketUtils();

			// extract the last 4 characters (the crc)
			let checkCrc = message.substr(message.length - 4).toLowerCase();
			let checkStr = message.substr(0, message.length - 4);
			let genCrc = utils
				.generateCRC(checkStr)
				.toString(16)
				.toLowerCase();
			let padCrc = utils.pad(genCrc, 4);

			//$happn.log.info('calculated CRC: ', genCrc);
			if (padCrc == checkCrc) {
				return message;
			} else {
				throw new Error(
					`--Invalid CRC | Check string: ${checkStr} Check CRC: ${checkCrc} Generated CRC: ${padCrc}`
				);
			}
		} catch (err) {
			$happn.log.error("parseBinaryMessage error", err);
		}
	};

	return parseBinaryAsync();
};

/***
 * @summary Extract data from a message return converted message once the
 * CRC has qualified
 * Incoming form the QUEUE SERVICE > INCOMING QUEUE
 * returnes a PARSED PACKET
 * @param $happn
 * @param message - the incoming message
 */
PacketService.prototype.extractData = function($happn, message) {
	const { parserFactory } = $happn.exchange;
	const utils = new PacketUtils();

	let extraxtAsync = async () => {
		try {
			let splitPacket = await utils.splitPacket(message);
			let command = splitPacket.command;
			let parser = await parserFactory.getParser(command); // use a factory to get the right parser...
			let result = await parser.parse($happn, splitPacket);
			return result;
		} catch (err) {
			$happn.log.error("extractData error", err);
		}
	};

	return extraxtAsync();
};

PacketService.prototype.buildNodeData = function($happn, parsedPacketArr) {
	const { parserFactory } = $happn.exchange;

	let buildNodeDataAsync = async () => {
		try {
			if (parsedPacketArr.length > 0) {
				let command = parseInt(parsedPacketArr[0].command, 2);

				let parser = await parserFactory.getParser(command); // use a factory to get the right parser...
				let result = await parser.buildNodeData($happn, parsedPacketArr);
				return result;
			} else {
				return null;
			}
		} catch (err) {
			$happn.log.error("buildNodeData error", err);
		}
	};
	return buildNodeDataAsync();
};

PacketService.prototype.buildOutgoingPacket = function(
	$happn,
	command,
	serial
) {
	const PacketUtils = require("../utils/packet_utils");
	let utils = new PacketUtils();

	let buildOutgoingAsync = async () => {
		try {
			let result = utils.buildOutgoingPacket($happn, command, serial);
			return result;
		} catch (err) {
			$happn.log.error("buildOutgoingPacket error", err);
		}
	};

	return buildOutgoingAsync();
};

module.exports = PacketService;
