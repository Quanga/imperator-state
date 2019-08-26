/* eslint-disable no-unused-vars */
const PacketTemplate = require("../constants/packetTemplates");

function PacketService() {
	const PacketUtils = require("../utils/packet_utils");
	this._utils = new PacketUtils();
}

PacketService.prototype.start = function($happn) {
	const { stateService } = $happn.exchange;
	const { name } = $happn;

	return (async () => {
		try {
			stateService.updateState({ service: name, state: "STARTED" });
		} catch (error) {
			stateService.updateState({ service: name, state: "FAILED", error });
		}
	})();
};

PacketService.prototype.stop = function($happn) {
	const { stateService } = $happn.exchange;
	const { name } = $happn;

	return (async () => {
		try {
			stateService.updateState({ service: name, state: "STOPPED" });
		} catch (error) {
			stateService.updateState({ service: name, state: "FAILED", error });
		}
	})();
};

/***
 * @summary Extract data from a message return converted message once the
 * CRC has qualified
 * Incoming from the QUEUE SERVICE > INCOMING QUEUE
 * returnes a PARSED PACKET
 * @param $happn
 * @param message - the incoming message
 */
PacketService.prototype.extractData = function($happn, msgObj) {
	const { parserFactory } = $happn.exchange;
	const { log } = $happn;

	const packetTemplate = new PacketTemplate();

	return (async () => {
		try {
			const packetType = parseInt(msgObj.packet.substr(6, 2), 16);
			const deviceTemplate = packetTemplate.incomingCommTemplate[packetType];

			let parser = await parserFactory.getParser(deviceTemplate);

			if (!parser) return log.warn("No Parser for packet - rejecting packet", msgObj.packet);
			const packet = {
				packet: msgObj.packet,
				createdAt: msgObj.createdAt
			};

			let parsedPacketArr = await parser.parse(packet);

			let unitsArr;

			if (parsedPacketArr.length === 0) {
				log.warn("no data found in parsed packet!");

				return [];
			}

			unitsArr = await parser.buildNodeData(parsedPacketArr);

			if (unitsArr.length > 0 && unitsArr[0].data === null)
				return log.warn("no data found in parsed packet data!");

			return unitsArr;
		} catch (err) {
			log.error("extractData error", err);
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
