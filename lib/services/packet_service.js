const PacketTemplate = require("../constants/packetTemplates");
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
	//app.setAppInfo(update, componentState.path);
	this.componentState = update;
};

/***
 * @summary Extract data from a message return converted message once the
 * CRC has qualified
 * Incoming from the QUEUE SERVICE > INCOMING QUEUE
 * returnes a PARSED PACKET
 * @param $happn
 * @param message - the incoming message
 */
PacketService.prototype.extractData = function($happn, msg) {
	const { parserFactory } = $happn.exchange;
	const { error: logError } = $happn.log;

	const packetTemplate = new PacketTemplate();

	let extraxtAsync = async () => {
		try {
			const packetType = parseInt(msg.message.substr(6, 2), 16);
			const deviceTemplate = packetTemplate.incomingCommTemplate[packetType];
			let parser = await parserFactory.getParser(deviceTemplate);

			const packet = {
				packet: msg.message,
				created: msg.created
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
PacketService.prototype.routePacket = function($happn, msgObj) {
	const { packetRepository } = $happn.exchange;
	const { error: logError } = $happn.log;
	const { emit } = $happn;
	const { message, created, passed, route, processed } = msgObj;

	const routePacketAsync = async () => {
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
	};

	return routePacketAsync();
};

module.exports = PacketService;
