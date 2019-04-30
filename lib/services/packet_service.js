/* eslint-disable no-unused-vars */
function PacketService() {
	const PacketUtils = require("../utils/packet_utils");
	this._utils = new PacketUtils();

	this.componentState = {
		name: "Packet Service",
		path: "service/packetService",
		index: 4,
		type: "Packet Parsing",
		serviceStatus: "STOPPED"
	};
}

PacketService.prototype.start = function($happn) {
	const { packetService } = $happn.exchange;
	const { info: logInfo } = $happn.log;

	return new Promise((resolve, reject) => {
		logInfo("Starting PacketService");
		packetService.setComponentStatus({ serviceStatus: "STARTED" });
		resolve();
	});
};

PacketService.prototype.stop = function($happn) {
	const { packetService } = $happn.exchange;
	const { info: logInfo } = $happn.log;

	return new Promise((resolve, reject) => {
		logInfo("Stopping PacketService");
		packetService.setComponentStatus({ serviceStatus: "STOPPED" });
		resolve();
	});
};

PacketService.prototype.setComponentStatus = function($happn, payload) {
	const { app } = $happn.exchange;
	const { componentState } = this;

	const update = { ...componentState, ...payload };
	app.setAppInfo(update, componentState.path);
	this.componentState = update;
};

/***
 * @summary Parse Binary data and return converted message once the
 * CRC has qualified
 * Incoming from the MESSAGE HANDLER
 * @param $happn
 * @param data - the incoming data
 * returns { message: string, passed: bool }
 */
PacketService.prototype.parseBinaryMessage = function($happn, data, created) {
	const { error: logError } = $happn.log;
	const { packetService } = $happn.exchange;

	let parseBinaryAsync = async () => {
		try {
			let message = data.toString("hex");
			let checkCrc = message.substr(message.length - 4).toLowerCase();
			let checkStr = message.substr(0, message.length - 4);
			let genCrc = this._utils
				.generateCRC(checkStr)
				.toString(16)
				.toLowerCase();
			let padCrc = this._utils.pad(genCrc, 4);

			if (padCrc == checkCrc) {
				await packetService.insertPacket({ message, created, passed: true });
			} else {
				logError(`Invalid CRC: ${checkStr} in packet`);
				await packetService.insertPacket({ message, created, passed: false });
			}
		} catch (err) {
			logError("parseBinaryMessage error", err);
		}
	};

	return parseBinaryAsync();
};

/***
 * @summary Extract data from a message return converted message once the
 * CRC has qualified
 * Incoming from the QUEUE SERVICE > INCOMING QUEUE
 * returnes a PARSED PACKET
 * @param $happn
 * @param message - the incoming message
 */
PacketService.prototype.extractData = function($happn, incomingMsg) {
	const { parserFactory } = $happn.exchange;
	const { error: logError } = $happn.log;

	const PacketTemplate = require("../constants/packetTemplates");
	const packetTemplate = new PacketTemplate();

	let extraxtAsync = async () => {
		try {
			const packetType = parseInt(incomingMsg.message.substr(6, 2), 16);
			const deviceTemplate = packetTemplate.incomingCommTemplate[packetType];
			let parser = await parserFactory.getParser(deviceTemplate);

			const packet = {
				packet: incomingMsg.message,
				created: incomingMsg.created
			};

			let result = await parser.parse($happn, packet);

			return result;
		} catch (err) {
			logError("extractData error", err);
		}
	};

	return extraxtAsync();
};

PacketService.prototype.buildNodeData = function($happn, parsedPacketArr) {
	const { parserFactory } = $happn.exchange;
	const { error: logError } = $happn.log;

	let buildNodeDataAsync = async () => {
		try {
			if (parsedPacketArr.length > 0) {
				if (parsedPacketArr[0]._data === null) return null;

				let parser = await parserFactory.getParser(parsedPacketArr[0].template); // use a factory to get the right parser...
				let result = await parser.buildNodeData($happn, parsedPacketArr);

				return result;
			} else {
				return null;
			}
		} catch (err) {
			logError("buildNodeData error", err);
		}
	};

	return buildNodeDataAsync();
};

PacketService.prototype.buildOutgoingPacket = function($happn, cmd, srl) {
	const { error: logError } = $happn.log;

	let buildOutgoingAsync = async () => {
		try {
			let result = this._utils.buildOutgoingPacket($happn, cmd, srl);
			return result;
		} catch (err) {
			logError("buildOutgoingPacket error", err);
		}
	};

	return buildOutgoingAsync();
};

/********************************************************************************
 PACKET DATA SERVICES
 ********************************************************************************/

/***
 * @summary Async function that takes the packet array and inserts inserts it into the packet database
 * @param $happn
 * @param packetArr - parsed node data that has been received from the IBC
 */
PacketService.prototype.insertPacket = function($happn, packet) {
	const { packetRepository } = $happn.exchange;
	const { error: logError } = $happn.log;

	const insertPacketArrAsync = async () => {
		// for (const packet of packetArr) {
		try {
			let route = packet.passed ? "queue" : "failed";
			await packetRepository.insert({
				path: `${route}/${packet.created}`,
				data: {
					created: packet.created,
					message: packet.message
				}
			});
		} catch (err) {
			logError("insertPacketArr update error", err);
		}
		// }
	};

	return insertPacketArrAsync();
};

module.exports = PacketService;
