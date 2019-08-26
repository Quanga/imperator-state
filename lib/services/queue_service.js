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
	const { name } = $happn;

	return (async () => {
		try {
			stateService.updateState({ service: name, state: "STARTED" });
		} catch (err) {
			stateService.updateState({ service: name, state: "FAILED" });
		}
	})();
};

/**
 *  <ul><li>Stop the component when Happner starts.</li>
 * <li> </li></ul><br>
 * @param {$happn} $happn
 * @returns {Promise}
 */
QueueService.prototype.componentStop = function($happn) {
	const { stateService } = $happn.exchange;
	const { name } = $happn;

	return (async () => {
		stateService.updateState({ service: name, state: "STOPPED" });
	})();
};

/**
 * @summary Process the incoming item
 * @param {$happn} $happn
 * @param {object} msgObj
 * @example { message, createdAt }
 */
QueueService.prototype.processIncoming = function($happn, msgObj) {
	const { log } = $happn;
	const { packetService, dataService } = $happn.exchange;

	return (async () => {
		try {
			console.log(msgObj);
			const createdTime = moment(msgObj.createdAt).format("HH:mm:ss.SSSS");

			log.info(`${createdTime}-${msgObj.createdAt} - message ${msgObj.packet} > received`);
			const unitsArr = await packetService.extractData(msgObj);

			if (!unitsArr || unitsArr.length === 0) return log.warn("No units to process");

			await dataService.upsertNodeDataArr(unitsArr);
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
