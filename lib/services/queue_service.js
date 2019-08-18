/* eslint-disable no-unused-vars */

/**
 * @category Transport
 * @module lib/services/queueService
 */
const moment = require("moment");
/**
 * @category Transport
 * @class QueueService
 * @requires better-queue
 * @requires server.js
 */
function QueueService() {
	this._eventRef = null;
	this._epRef = null;
}

/**
 *  <ul><li>Start the component when Happner starts.</li>
 * <li> Starts a listener for a BLAST_STARTED event emitted from the dataService</li></ul><br>
 * @param {$happn} $happn
 * @returns {Promise}
 */
QueueService.prototype.componentStart = function($happn) {
	const { stateService } = $happn.exchange;
	const { log, name } = $happn;

	return (async () => {
		try {
			stateService.updateState({ service: $happn.name, state: "PENDING" });

			log.info("Initializing Queue Service..............");
		} catch (err) {
			log.error("Error starting queueService", err);
		}
	})();
};

/**
 *  <ul><li>Stop the component when Happner starts.</li>
 * <li> </li></ul><br>
 * @param {$happn} $happn
 * @returns {Promise}
 * @todo HANDLE REMOVAL OF MESH LISTNERS
 */
QueueService.prototype.componentStop = function($happn) {
	const { env } = $happn.config;
	const { log } = $happn;

	return (async () => {})();
};

/**
 * @summary Process the incoming item
 * @param {$happn} $happn
 * @param {object} msgObj
 * @example { message, created }
 */
QueueService.prototype.processIncoming = function($happn, msgObj) {
	const { log } = $happn;
	const { packetService, dataService } = $happn.exchange;

	return (async () => {
		try {
			log.info(
				`${moment(msgObj.created).format("HH:mm:ss.SSSS")}-${msgObj.created} - message ${
					msgObj.packet
				} > received`
			);
			const parsedPacket = await packetService.extractData(msgObj);

			if (parsedPacket.length === 0) return log.warn("no data found in parsed packet!");

			if (parsedPacket.length > 0 && parsedPacket[0].data === null)
				return log.warn("no data found in parsed packet data!");

			const nodeData = await packetService.buildNodeData(parsedPacket);
			await dataService.upsertNodeDataArr(nodeData);
		} catch (err) {
			return log.error(`Processing Queue Error.............. - ${err}`);
		}
	})();
};

/**
 * @summary Add an item to the outgoing queue
 * @param {$happn} $happn
 * @param {string} packet
 * @todo THIS IS NOT FLESHED OUT YET
 */
QueueService.prototype.addToQueue = function($happn, packet) {
	const { log } = $happn;

	return (async () => {
		log.info(`packet - ${packet} added to outgoing queue`);
		this.incomingQueue.push(packet);
	})();
};

module.exports = QueueService;
