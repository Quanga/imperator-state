/* eslint-disable no-unused-vars */
const Timer = require("tiny-timer");
const BlastModel = require("../models/blastModel");
const clone = require("clone");

const { blastModelStates } = require("../constants/stateConstants");
const {
	blastModelEvents,
	blastServiceEvents,
	eventServiceEvents,
} = require("../constants/eventConstants");

const {
	BLAST_TIMER_COMPLETE,
	BLAST_DATA_COMPLETE,
	BLAST_TIMER_COMPLETE_BYPACKET,
	BLAST_TERMINATED,
} = blastModelStates;

/**
 * @category Services
 * @module lib/services/BlastService
 */

/**
 * @class BlastService
 * @requires BlastModel
 * @property {object} this.currentBlast  The active current Blast
 */
function BlastService() {
	this.currentBlast = null;
	this.eventRefLog = null;
}

/**
 * @summary Create a new blast
 * @param {$happn} $happn
 * @param {number} createdAt
 * @param {*} snapShot
 * @returns {Promise}
 */
BlastService.prototype.createNewBlast = function($happn, createdAt, snapShot) {
	const { blastService, blastRepository } = $happn.exchange;
	const { env } = $happn.config;
	const { log } = $happn;

	return (async () => {
		try {
			if (this.currentBlast) {
				const msg = "Blast Creation error: Blast in progress - another fire button detected";
				await blastService.logEvent("BLAST_ERROR_LOG", createdAt, msg);
				log.warn(msg);
				return false;
			}
			const opts = {
				reportingDuration: env.systemReportTime,
				firingDuration: env.systemFiringTime,
			};
			this.currentBlast = {
				createdAt: createdAt,
				blastEvent: BlastModel.create(createdAt)
					.withOpts(opts)
					.withSnapshot(snapShot)
					.start(),
			};

			const { blastEvent } = this.currentBlast;
			log.info(`Creating new blast - ${blastEvent.data.id} - ${blastEvent.data.createdAt}`);

			await blastRepository.upsertIndex(this.currentBlast);
			await blastRepository.set(this.currentBlast);
			await blastService.subscribeToBlastEvents();

			blastService.startTimer("firing", "BLAST_TIMER", env.systemFiringTime, () => {
				blastService.startTimer("reporting", "REPORT_TIMER", env.systemReportTime);
			});

			await blastService.logEvent("BLAST_STARTED", this.currentBlast.blastEvent.data.createdAt, null);

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
			blastEvent.on("log", async data => {
				if (
					data === BLAST_TIMER_COMPLETE ||
					data === BLAST_DATA_COMPLETE ||
					data === BLAST_TIMER_COMPLETE_BYPACKET ||
					data === BLAST_TERMINATED
				) {
					await blastService.closeBlast(data);
				}
			});

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

	return (async () => {
		try {
			this.currentBlast.blastEvent.addLog(logObj);
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
	const { log, emit, event } = $happn;

	return (async () => {
		try {
			if (!this.currentBlast) throw new Error("No current blast event to close");
			if (!this.currentBlast.blastEvent) throw new Error("No blast event to close");

			this.currentBlast.blastEvent.removeAllListeners();
			event.eventService.off(this.eventRefLog, err => {
				this.eventRefLog = undefined;
			});

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
			serial: this.currentBlast.blastEvent.data.serial,
			createdAt,
			typeId: 0,
			msg,
		});
	})();
};

//#region BLAST REPORT UTILITIES

/**
 * @summary Utility function to remove the Blast ID from
 * the index and the Blast Object in the Blast Repo.
 * @param {$happn} $happn
 * @param {string} id The blast ID
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
			const blastReport = await blastRepository.get(id);
			delete blastReport._meta;
			const opts = {
				report: blastReport,
				theme: env.theme,
				template: env.template,
				filename: "emailReport",
			};
			const pdfFile = await $happn.exchange["mesh-pdf"].pdfService.createPDF(opts);

			if (pdfFile instanceof Error) throw new Error("Failed to create PDF");

			return pdfFile;
		} catch (error) {
			log.error("Error creating PDF", error);
		}
	})();
};

/**
 * @summary Function which return the Blast Object.
 * @param {$happn} $happn
 * @param {string} id The blast ID to be sent to the PDF utility
 * @returns {promise}
 */
BlastService.prototype.getBlast = function($happn, id) {
	const { blastRepository } = $happn.exchange;
	const { log } = $happn;

	return (async () => {
		try {
			const blastReport = await blastRepository.get(id);

			return blastReport;
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

//#endregion

module.exports = BlastService;
