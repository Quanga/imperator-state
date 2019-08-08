const PacketTemplate = require("../constants/packetTemplates");
/* eslint-disable no-unused-vars */
function PacketService() {
	const PacketUtils = require("../utils/packet_utils");
	this._utils = new PacketUtils();
}

PacketService.prototype.start = function($happn) {
	const { stateService } = $happn.exchange;
	const { info: logInfo, error: logError } = $happn.log;

	return (async () => {
		try {
			logInfo("Starting PacketService.......");
			stateService.updateState({ service: $happn.name, state: "STARTED" });
		} catch (err) {
			logError("Error starting PacketService", err);
			stateService.updateState({ service: $happn.name, state: "FAILED" });
		}
	})();
};

PacketService.prototype.stop = function($happn) {
	const { stateService } = $happn.exchange;
	const { info: logInfo, error: logError } = $happn.log;

	return (async () => {
		try {
			logInfo("Starting PacketService.......");
			stateService.updateState({ service: $happn.name, state: "STOPPED" });
		} catch (err) {
			logError("Error starting PacketService", err);
			stateService.updateState({ service: $happn.name, state: "FAILED" });
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
	const { error: logError } = $happn.log;

	const packetTemplate = new PacketTemplate();

	return (async () => {
		try {
			const packetType = parseInt(msgObj.packet.substr(6, 2), 16);
			const deviceTemplate = packetTemplate.incomingCommTemplate[packetType];
			let parser = await parserFactory.getParser(deviceTemplate);

			const packet = {
				packet: msgObj.packet,
				created: msgObj.created
			};

			let result = await parser.parse($happn, packet);

			return result;
		} catch (err) {
			logError("extractData error", err);
		}
	})();
};

PacketService.prototype.buildNodeData = function($happn, parsedPacketArr) {
	const { parserFactory } = $happn.exchange;
	const { error: logError } = $happn.log;

	return (async () => {
		try {
			if (parsedPacketArr.length > 0) {
				if (parsedPacketArr[0]._data === null) return null;
				// use a factory to get the right parser...
				let parser = await parserFactory.getParser(parsedPacketArr[0].template);
				let result = await parser.buildNodeData($happn, parsedPacketArr);

				return result;
			} else {
				return null;
			}
		} catch (err) {
			logError("buildNodeData error", err);
		}
	})();
};

PacketService.prototype.buildOutgoingPacket = function($happn, cmd, srl) {
	const { error: logError } = $happn.log;

	return (async () => {
		try {
			let result = this._utils.buildOutgoingPacket($happn, cmd, srl);
			return result;
		} catch (err) {
			logError("buildOutgoingPacket error", err);
		}
	})();
};

/********************************************************************************
 PACKET DATA SERVICES
 ********************************************************************************/

/***
 * @summary Async function that takes the packet array and inserts inserts it into the packet database
 * @param $happn
 * @param packetArr - parsed node data that has been received from the IBC
 */
PacketService.prototype.routePacket = function($happn, msgObj) {
	const { packetRepository } = $happn.exchange;
	const { error: logError } = $happn.log;
	const { emit } = $happn;
	const { message, created, passed, route, processed } = msgObj;

	return (async () => {
		try {
			const repoRoute = passed ? `${route}/queue` : `${route}/failed`;
			let path = `${repoRoute}/${created}`;

			if (processed) {
				const deleted = await packetRepository.delete(path);
				path = `${route}/processed/${created}`;
			}

			const insertedPacket = await packetRepository.set(path, {
				data: {
					created: created,
					message: message,
					passed: passed,
					route: route,
					processed: processed
				}
			});

			if (passed && !processed) emit("INCOMING_PACKET", insertedPacket);
		} catch (err) {
			logError("routing packet error", err);
		}
	})();
};

module.exports = PacketService;
