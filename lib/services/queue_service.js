/* eslint-disable no-unused-vars */
const { PerformanceObserver, performance } = require("perf_hooks");

/**
 * @module lib/services/queueService
 */
const moment = require("moment");
const CRC = require("../utils/crc");

/**
 * @class
 * @requires better-queue
 * @requires server.js
 */
class QueueService {
	constructor() {
		this._eventRef = null;
		this._epRef = null;
	}

	async start($happn) {
		const { log } = $happn;

		this.obs = new PerformanceObserver((items) => {
			log.info(`[ QUEUE PERFORMANCE ]:${items.getEntries()[0].duration}`);
			performance.clearMarks();
		});
		this.obs.observe({ entryTypes: ["measure"] });
	}

	/**
	 * @summary Process the incoming item
	 * @param {$happn} $happn
	 * @param {object} msgObj
	 * @example { message, createdAt }
	 */
	async processIncoming($happn, msgObj) {
		const { parserService, dataService, queueService } = $happn.exchange;
		const { log } = $happn;

		try {
			performance.mark("Q1");
			await queueService.validatePacket(msgObj); //will throw on structure and format issues
			const createdTime = moment(msgObj.createdAt, "x").format("DD-MM-YYYY HH:mm:ss.SSSS");
			log.info(`Queued - << ${createdTime} - ${msgObj.createdAt} - ${msgObj.packet} >>`);
			const unitsObj = await parserService.extractData(msgObj); //Extract the packet to an array of Unit Models
			if (
				!unitsObj ||
				!Object.prototype.hasOwnProperty.call(unitsObj, "units") ||
				unitsObj.units.length === 0
			)
				throw new Error(`Packet could not be processed - \
				no data will be sent to DataService`);
			await dataService.processUnitObj(unitsObj);
			performance.mark("Q2");
			performance.measure("Q1 to Q2", "Q1", "Q2");
			return true;
		} catch (error) {
			log.warn(`Queue error: ${error.message}`);
			return false;
		}
	}

	/**
	 * @summary Pre-validation of the incoming packet
	 * Will throw if there is an error
	 * @param {$happn} $happn
	 * @param {object} msgObj
	 * @returns {promise}
	 * @example { packet, createdAt }
	 */
	async validatePacket($happn, msgObj) {
		["packet", "createdAt"].forEach((prop) => {
			if (!Object.prototype.hasOwnProperty.call(msgObj, prop))
				throw new TypeError(`Packet ${msgObj} is missing ${prop} property`);
		});
		if (!moment(msgObj.createdAt, "x").isValid())
			throw new TypeError(`Packet ${msgObj} has and invalid date format`);
		if (process.env.NODE_ENV === "test") {
			const preCrc = msgObj.packet.substring(0, msgObj.packet.length - 4);
			const crcCalc = CRC.generateCRC(preCrc).toString(16).padStart(4, "0");
			const packetCRC = msgObj.packet.substring(msgObj.packet.length - 4, msgObj.packet.length);
			if (crcCalc !== packetCRC) throw new Error(`Packet ${msgObj} has and invalid CRC format`);
		}
	}
}

module.exports = QueueService;
