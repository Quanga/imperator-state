/* eslint-disable max-len */
/* eslint-disable no-unused-vars */

const moment = require("moment");
const CRC = require("../utils/crc");

/**
 * @category Services
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
	const { packetService, dataService, eventService, queueService } = $happn.exchange;
	const { log } = $happn;

	return (async () => {
		try {
			//will throw on structure and format issues
			await queueService.validatePacket(msgObj);

			const createdTime = moment(msgObj.createdAt, "x").format("DD-MM-YYYY HH:mm:ss.SSSS");
			log.info(`Queued - << ${createdTime} - ${msgObj.createdAt} - ${msgObj.packet} >>`);

			//Extract the packet to an array of Unit Models
			const unitsArr = await packetService.extractData(msgObj); //returns array of unit objects

			if (!unitsArr || !Array.isArray(unitsArr) || unitsArr.length === 0)
				throw new Error(`Packet could not be processed - no data will be sent to DataService`);

			const dataUpserted = await dataService.upsertNodeDataArr(unitsArr);

			if (dataUpserted instanceof Error)
				throw new Error(
					`Error upserting processed packet - ${msgObj.createdAt} - ${msgObj.packet} : ${dataUpserted.message}`
				);

			return true;
		} catch (error) {
			log.warn(`Queue error: ${error.message}`);
			await eventService.logPacketError({ msgObj, error: error.message });
			return false;
		}
	})();
};

/**
 * @summary Pre-validation of the incoming packet
 * Will throw if there is an error
 * @param {$happn} $happn
 * @param {object} msgObj
 * @returns {promise}
 * @example { packet, createdAt }
 */
QueueService.prototype.validatePacket = function($happn, msgObj) {
	return (async () => {
		// if in TEST env, check the CRC of the file

		if (!msgObj.hasOwnProperty("packet"))
			throw new TypeError(`Packet ${msgObj} is missing Packet property`);

		if (!msgObj.hasOwnProperty("createdAt"))
			throw new TypeError(`Packet ${msgObj} is missing Date property`);

		if (!moment(msgObj.createdAt, "x").isValid())
			throw new TypeError(`Packet ${msgObj} has and invalid date format`);

		if (process.env.NODE_ENV === "test") {
			const preCrc = msgObj.packet.substring(0, msgObj.packet.length - 4);

			const crcCalc = CRC.generateCRC(preCrc)
				.toString(16)
				.padStart(4, "0");

			const packetCRC = msgObj.packet.substring(msgObj.packet.length - 4, msgObj.packet.length);

			if (crcCalc !== packetCRC) throw new Error(`Packet ${msgObj} has and invalid CRC format`);
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
		log.info(`packet - ${JSON.stringify(packet)} added to outgoing queue`);
		this.incomingQueue.push(packet);
	})();
};

module.exports = QueueService;
