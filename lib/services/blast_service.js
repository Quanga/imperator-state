/* eslint-disable no-unused-vars */
const Timer = require("tiny-timer");
const clone = require("clone");
const fields = require("../configs/fields/fieldConstants");
const { typeId, serial, createdAt } = fields;

const BlastModel = require("../models/blastModel");

const { blastModelStates } = require("../configs/states/stateConstants");

const {
	blastModelEvents,
	blastServiceEvents,
	eventServiceEvents,
	dataModelEvents,
} = require("../constants/eventConstants");
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

/**
 *  <ul><li>Start the component when Happner starts.</li>
 * <li> Starts a listener for a BLAST_STARTED event emitted from the dataService</li></ul><br>
 * @param {$happn} $happn
 * @returns {Promise}
 */
BlastService.prototype.componentStart = function($happn) {
	const { blastService } = $happn.exchange;
	const { dataService } = $happn.event;
	const { log } = $happn;

	return (async () => {
		try {
			dataService.on(
				"state",
				(data, meta) => {
					console.log("HEARING STATE ");
					if (data[typeId] === 0 && data.state.operation === "firing") {
						blastService.createNewBlast(data[createdAt]);
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

/**
 * @summary Stop the component when Happner stops
 * @param {$happn} $happn
 * @returns {Promise}
 */
BlastService.prototype.componentStop = function($happn) {
	return (async () => {})();
};

/**
 * @summary Create a new blast
 * @param {$happn} $happn
 * @param {number} createdAt
 * @param {object} snapShot
 * @returns {Promise}
 */
BlastService.prototype.createNewBlast = function($happn, timeStamp) {
	const { blastService, blastRepository, dataService } = $happn.exchange;
	const { systemFiringTime, systemReportTime, fsm } = $happn.config.env;
	const { log } = $happn;

	return (async () => {
		try {
			if (this.currentBlast) {
				const msg = "Blast Creation error: Blast in progress - another fire button detected";
				await blastService.logEvent("BLAST_ERROR_LOG", createdAt, msg);
				log.warn(msg);
				return false;
			}
			const snapShot = await dataService.getSnapShot();

			this.currentBlast = {
				[createdAt]: createdAt,
				blastEvent: BlastModel.create(timeStamp)
					.withOpts(systemFiringTime, systemReportTime)
					.withSnapShot(snapShot)
					.withFSM(fsm)
					.on("log", msg => log.info(msg))
					.on("state", state => log.info("BS: state", state))
					.on("start", data => blastService.logEvent("BLAST_STARTED", data[fields.createdAt], null))
					.on("error", err => log.error(err))
					.start(),
			};

			await blastRepository.upsertIndex(this.currentBlast);
			await blastRepository.set(this.currentBlast);
			await blastService.subscribeToBlastEvents();

			blastService.startTimer("firing", "BLAST_TIMER", systemFiringTime, () => {
				blastService.startTimer("reporting", "REPORT_TIMER", systemReportTime);
			});

			return true;
		} catch (err) {
			log.error("Cannot create new Blast Model", err);
		}
	})();
};

/**
 * @summary Subcribe to the blast events
 * @param {$happn} $happn
 * @returns {Promise} void
 */
BlastService.prototype.subscribeToBlastEvents = function($happn) {
	const { blastService } = $happn.exchange;
	const { log, event } = $happn;
	const { blastEvent } = this.currentBlast;

	return (async () => {
		try {
			//blastEvent.event.;

			event.eventService.on(
				eventServiceEvents.UPDATE_LOG,
				data => {
					if (this.currentBlast) {
						blastService.updateBlast(data);
					}
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

/**
 * @summary Function used to update the blast with any logs
 * @param {$happn} $happn
 * @param {*} logObj
 * @returns {Promise}
 */
BlastService.prototype.updateBlast = function($happn, logObj) {
	const { log } = $happn;
	const { blastRepository } = $happn.exchange;

	return (async () => {
		try {
			this.currentBlast.blastEvent.addLog(logObj);
			//await blastRepository.set(this.currentBlast);
		} catch (err) {
			log.error("Error writing new blast object", err);
		}
	})();
};

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
			if (!this.currentBlast.blastEvent) throw new Error("No blast event to close");

			this.currentBlast.blastEvent.event.removeAllListeners(blastModelEvents.BLASTMODEL_LOG);

			log.info(`Closing blast ${this.currentBlast.blastEvent.data.id} with proc(${closeProc})`);

			const snapShot = await dataService.getSnapShot();
			this.currentBlast.blastEvent.setSnapshot(snapShot, "end");

			const cloneBlast = clone(this.currentBlast);
			await blastRepository.set(cloneBlast);
			await blastRepository.upsertIndex(cloneBlast);

			if (this["firing"]) {
				emit("firing", 0);
				this["firing"].stop();
				this["firing"] = null;
			}

			if (this["reporting"]) {
				emit("reporting", 0);
				this["reporting"].stop();
				this["firing"] = null;
			}

			if (this.currentBlast.state === blastModelStates.BLAST_TERMINATED) {
				await blastService.logEvent(
					"BLAST_TERMINATED",
					this.currentBlast.blastEvent.data.blastClosed,
					closeProc,
				);
			} else {
				await blastService.logEvent(
					"BLAST_COMPLETED",
					this.currentBlast.blastEvent.data.blastClosed,
					closeProc,
				);
			}
			delete this.currentBlast.blastEvent;
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
		await eventService.handleEvent({
			type: blastServiceEvents.BLAST_LOG,
			logType,
			[fields.serial]: this.currentBlast.blastEvent.data.serial,
			[fields.createdAt]: createdAt,
			[fields.typeId]: 0,
			msg,
		});
	})();
};

/*************************************************************************
 *   BLAST REPORT UTILITIES
 *************************************************************************/

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
	const { blastRepository } = $happn.exchange;
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

BlastService.prototype.startTimer = function($happn, timer, event, duration, callback) {
	const { emit, log } = $happn;

	log.info(`${timer} Started at ${duration}ms`);

	this[timer] = new Timer({ stopwatch: false });

	this[timer].on("tick", ms => emit(event, Math.round(ms / 1000) * 1000));
	this[timer].on("done", () => {
		log.info(`${timer} stopped`);
		emit(event, 0);
		//this[timer].removeAllListeners();
		delete this[timer];
		callback();
	});

	this[timer].start(duration);
};

module.exports = BlastService;
