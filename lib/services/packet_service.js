/* eslint-disable no-unused-vars */
const PacketTemplate = require("../constants/packetTemplates");
const PacketValidation = require("../parsers/packetValidataion");

/**
 * @category Services
 * @module lib/services/PacketService
 */

/**
 * @class
 */
function PacketService() {
	const PacketUtils = require("../utils/packet_utils");
	this.__modes = require("../constants/modeTemplates");
	this._utils = new PacketUtils();
	this.__packetTemplate = new PacketTemplate();
	this.packetValidataion = new PacketValidation();
}

/***
 * @summary Extract data from a message return converted message once the
 * CRC has qualified
 * Incoming from the QUEUE SERVICE > INCOMING QUEUE
 * returnes a PARSED PACKET
 * @param $happn
 * @param message - the incoming message
 */
PacketService.prototype.extractData = function($happn, msgObj) {
	const { packetService } = $happn.exchange;
	const { log } = $happn;

	return (async () => {
		try {
			let validObj = await packetService.validatePacket(msgObj);

			if (!validObj) return;
			const { parser, validPacket } = validObj;

			const parsedPacketArr = await parser.parse(validPacket);

			if (parsedPacketArr.length === 0)
				throw new Error(`Could not Parse the packet - ${msgObj.packet}`);

			const unitsArr = await parser.buildNodeData(parsedPacketArr);

			if (unitsArr.length > 0 && unitsArr[0].data === null)
				throw new Error("no data found in parsed packet data!");

			return unitsArr;
		} catch (err) {
			log.warn("extractData error", err.message);
			return null;
		}
	})();
};

PacketService.prototype.validatePacket = function($happn, msgObj) {
	const { parserFactory } = $happn.exchange;
	const { env } = $happn.config;
	const { log } = $happn;

	return (async () => {
		try {
			const { packet } = msgObj;
			const packetType = parseInt(packet.substr(6, 2), 16);

			if (this.__modes[env.systemMode].commands.indexOf(packetType) === -1)
				throw new Error(`Packet command not available on this system ${packet}`);

			const deviceTemplate = this.__packetTemplate.incomingCommTemplate[packetType];

			if (!deviceTemplate) throw new Error(`No Device Template for this command -  ${packet}`);

			const validPacket = this.packetValidataion.validatePacket(msgObj, deviceTemplate.chunk);

			if (!validPacket) throw new Error(`Packet Validation Failed for ${packet}`);

			const parser = await parserFactory.getParser(deviceTemplate);
			if (!parser) throw new Error("No Parser for packet - rejecting packet", msgObj.packet);

			return { parser, validPacket };
		} catch (error) {
			log.warn("Packet Validation Error: ", error.message);
			return null;
		}
	})();
};

PacketService.prototype.buildOutgoingPacket = function($happn, cmd, srl) {
	const { log } = $happn;

	return (async () => {
		try {
			let result = this._utils.buildOutgoingPacket($happn, cmd, srl);
			return result;
		} catch (err) {
			log.error("buildOutgoingPacket error", err);
		}
	})();
};

/********************************************************************************
 PACKET DATA SERVICES
 ********************************************************************************/

/***
 * @summary Async function that takes the packet array and
 *  inserts inserts it into the packet database
 * @param $happn
 * @param packetArr - parsed node data that has been received from the IBC
 */
PacketService.prototype.routePacket = function($happn, msgObj) {
	const { packetRepository } = $happn.exchange;
	const { emit, log } = $happn;

	const { message, createdAt, passed, route, processed } = msgObj;

	return (async () => {
		try {
			const repoRoute = passed ? `${route}/queue` : `${route}/failed`;
			let path = `${repoRoute}/${createdAt}`;

			if (processed) {
				const deleted = await packetRepository.delete(path);
				path = `${route}/processed/${createdAt}`;
			}

			const insertedPacket = await packetRepository.set(path, {
				data: {
					createdAt: createdAt,
					message: message,
					passed: passed,
					route: route,
					processed: processed
				}
			});

			if (passed && !processed) emit("INCOMING_PACKET", insertedPacket);
		} catch (err) {
			log.error("routing packet error", err);
		}
	})();
};

module.exports = PacketService;
