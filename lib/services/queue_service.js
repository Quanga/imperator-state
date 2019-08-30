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
	const { packetService, dataService, eventService } = $happn.exchange;
	const { log } = $happn;

	return (async () => {
		try {
			if (!msgObj.createdAt || !moment(msgObj.createdAt, "x").isValid())
				throw new TypeError(`Packet ${msgObj} has and invalid date format`);

			const createdTime = moment(msgObj.createdAt, "x").format("DD-MM-YYYY HH:mm:ss.SSSS");
			log.info(`Queued - << ${createdTime} - ${msgObj.createdAt} - ${msgObj.packet} >>`);

			const unitsArr = await packetService.extractData(msgObj);

			if (!unitsArr || !Array.isArray(unitsArr) || unitsArr.length === 0)
				throw new Error(`Packet could not be processed - no data will be sent to DataService`);

			const dataUpserted = await dataService.upsertNodeDataArr(unitsArr);

			if (!dataUpserted)
				throw new Error(
					`Error upserting processed packet - ${msgObj.createdAt} - ${msgObj.packet}`
				);

			return true;
		} catch (error) {
			log.warn(`Queue error: ${error.message}`);
			await eventService.logPacketError({ msgObj, error });
			return false;
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
