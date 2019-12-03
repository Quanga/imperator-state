/* eslint-disable no-unused-vars */
const clone = require("clone");
const EventLog = require("../models/logModel");
const fields = require("../configs/fields/fieldConstants");
const { typeId, serial, createdAt } = fields;

const BlastModel = require("../models/blastModel");
const modes = require("../configs/modes/modes");
const uuid = require("uuid");

/**
 * @category Blast Service
 * @module lib/services/blastService
 */

/**
 * @category Blast Service
 * @class BlastService
 * @requires BlastModel
 * @requires pdfUtils
 * @property {object} this.currentBlast  The active current Blast
 */
function BlastService() {
	this.currentBlast = null;
	this.eventRefLog = null;
	this.dataServiceEventRefs = [];
}

//#region Startup Component
/**
 *  <ul><li>Start the component when Happner starts.</li>
 * <li> Starts a listener for a BLAST_STARTED event emitted from the dataService</li></ul><br>
 * @param {$happn} $happn
 * @returns {Promise}
 */
BlastService.prototype.componentStart = function($happn) {
	const { blastService } = $happn.exchange;
	const { log } = $happn;

	return (async () => {
		try {
			await blastService.subscribeToDataModel();
		} catch (error) {
			log.error(error);
		}
	})();
};

BlastService.prototype.subscribeToDataModel = function($happn) {
	const { blastService } = $happn.exchange;
	const { dataService } = $happn.event;
	const { log } = $happn;
	return (async () => {
		try {
			dataService.on(
				"state",
				data => {
					if (data[typeId] === 0) {
						switch (data.state.operation) {
							case "firing":
								blastService.createNewBlast(data[createdAt]);
								break;
							case "firing_aborted":
								blastService.closeBlast();
								break;
							case "firing_complete":
								this.currentBlast.toggleState(data);
								break;
							default:
								break;
						}
					}
				},
				(error, _eventRef) => {
					if (error) {
						log.error("Cannot subscribe to dataService component");
						log.error(error);
						return;
					}
					this.dataServiceEventRefs.push(_eventRef);
				},
			);
		} catch (error) {
			log.error(error);
		}
	})();
};

//#endregion

/**
 * @summary Stop the component when Happner stops
 * @param {$happn} $happn
 * @returns {Promise}
 */
BlastService.prototype.componentStop = function($happn) {
	return (async () => {})();
};

//#region Create Blasts and intialise
/**
 * @summary Create a new BlastModel using the BlastModel Builder.
 * @param {$happn} $happn
 * @param {number} createdAt
 * @param {object} snapShot
 * @returns {Promise}
 * @todo Inject a unique blast ID which relates to the time and client
 */
BlastService.prototype.createNewBlast = function($happn, timeStamp) {
	const { blastService, blastRepository, dataService } = $happn.exchange;
	const { systemMode, fsm } = $happn.config.env;
	const { log, emit } = $happn;

	return (async () => {
		try {
			if (this.currentBlast) {
				const msg = "Blast Creation error: Blast in progress - another fire button detected";
				await blastService.logEvent("BLAST_ERROR_LOG", createdAt, msg);
				log.warn(msg);
				return false;
			}
			const snapShot = await dataService.getSnapShot();

			const firingDuration = modes[systemMode].constraints.firingTime;
			const reportingDuration = modes[systemMode].constraints.reportTime;

			this.currentBlast = BlastModel.create(timeStamp)
				.withId(uuid.v4())
				.withTimer("firing", firingDuration)
				.withTimer("reporting", reportingDuration)
				.withSnapshot(snapShot)
				.withFSM(fsm)
				.on("log", msg => log.info(msg))
				.on("state", data => {
					blastService.logEvent("blastModel/STATE", data);
					if (data.state === "watching")
						log.info(`Blast Firing complete ${this.currentBlast.meta.id} - awaiting closure`);
					if (data.state === "closed") blastService.closeBlast(data.context.method);
				})
				.on("timer", timer => emit("timer", timer))
				.on("error", err => log.error(err))
				.start();

			const blastData = clone(this.currentBlast.blastReport);

			await blastRepository.upsertIndex(blastData);
			await blastRepository.set(blastData);
			await blastService.subscribeToBlastEvents();

			return true;
		} catch (err) {
			log.error("Cannot create new Blast Model", err);
		}
	})();
};

BlastService.prototype.getBlastModel = function($happn) {
	return (async () => {
		return clone(this.currentBlast.blastReport);
	})();
};

/**
 * @summary Subcribe to the eventService diff logs
 * @param {$happn} $happn
 * @returns {Promise} void
 */
BlastService.prototype.subscribeToBlastEvents = function($happn) {
	const { log } = $happn;
	const { eventService } = $happn.event;

	return (async () => {
		try {
			eventService.on(
				"eventService/*",
				data => {
					if (this.currentBlast) this.currentBlast.addLog(data);
				},
				(err, evRef) => {
					if (err) throw new Error("Error subscribing to eventService", err);

					this.eventRefLog = evRef;
				},
			);
		} catch (err) {
			log.error(err);
		}
	})();
};

//#endregion

//#region BlastModel operational methods

/**
 * @summary Close off the Blast - works off this.currentBlast
 * @param {$happn} $happn
 * @returns {Promise}
 */
BlastService.prototype.closeBlast = function($happn, closeProc) {
	const { blastRepository, dataService, blastService } = $happn.exchange;
	const { log, emit } = $happn;

	return (async () => {
		try {
			if (!this.currentBlast) throw new Error("No current blast event to close");

			log.info(`Closing blast ${this.currentBlast.meta.id} with proc(${closeProc})`);
			this.currentBlast.removeAllListeners();

			const snapShot = await dataService.getSnapShot();
			this.currentBlast.setSnapshot(snapShot, "end");

			const blastData = clone(this.currentBlast.blastReport);

			await blastRepository.set(blastData);
			await blastRepository.upsertIndex(blastData);

			delete this.currentBlast;
		} catch (err) {
			log.error("Error closing Blast Event", err);
		}
	})();
};

/**
 * @summary Sends an event to the event service
 * @param {$happn} $happn
 * @param {string} logType
 * @param {number} createdAt
 * @returns {Promise} void
 */
BlastService.prototype.logEvent = function($happn, logType, createdAt, msg) {
	const { eventService } = $happn.exchange;

	return (async () => {
		const eventLog = EventLog.create(createdAt)
			.setLogType(logType)
			.setSerial(this.currentBlast.meta.serial)
			.setTypeId(0)
			.withMessage(msg);

		await eventService.handleEvent(eventLog);
	})();
};

//#endregion

//region UI utilities
/**
 * @summary Utility function to remove the Blast ID from
 * the index and the Blast Object in the Blast Repo.
 * @param {$happn} $happn
 * @param {string} id The blast ID to be sent to the PDF utility
 * @returns {promise}
 */
BlastService.prototype.deleteBlast = function($happn, id) {
	const { blastRepository } = $happn.exchange;
	const { log } = $happn;

	return (async () => {
		try {
			log.info("Removing Blast Report", id);
			await blastRepository.delete(id);
			await blastRepository.deleteIndex(id);
			return true;
		} catch (err) {
			log.error("Error deleting blast Report", err);
		}
	})();
};

/**
 * @summary Function to get a Blast JSON Object and send it to the PDF Utility.
 * @param {$happn} $happn
 * @param {string} id The blast ID to be sent to the PDF utility
 * @returns {promise}
 */
BlastService.prototype.pdfBlast = function($happn, id) {
	const { env } = $happn.config;
	const { log } = $happn;

	return (async () => {
		try {
			// const pdfUtils = new PdfUtil();
			// const blastReport = await blastRepository.get(id);
			// delete blastReport._meta;
			// pdfUtils.createContent(blastReport, env.theme);
			// let pdfFile = await pdfUtils.createPdf(blastReport);
			// return pdfFile;
		} catch (error) {
			log.error("Error creating PDF", error);
		}
	})();
};

//#endregion

module.exports = BlastService;
