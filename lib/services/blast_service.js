/* eslint-disable no-unused-vars */

const BlastModel = require("../models/blastModel");
const PdfUtil = require("../utils/pdfUtils");
/**
 * @category Blast Service
 * @module lib/services/blastService
 */

/**
 * @category Blast Service
 * @class BlastService
 * @requires class:BlastModel
 * @requires pdfUtils
 * @property {object} this.currentBlast  The active current Blast
 */
function BlastService() {
	this.currentBlast = null;

	this.eventRefLog = null;
	this.eventRefDet = null;
}

/**
 *  <ul><li>Start the component when Happner starts.</li>
 * <li> Starts a listener for a BLAST_STARTED event emitted from the dataService</li></ul><br>
 * @param {$happn} $happn
 * @returns {Promise}
 */
BlastService.prototype.componentStart = function($happn) {
	const { blastService, stateService } = $happn.exchange;
	const { dataService } = $happn.event;
	const { name } = $happn;

	return (async () => {
		try {
			stateService.updateState({ service: name, state: "STARTED" });

			dataService.on(
				"BLAST_STARTED",
				data => {
					blastService.createNewBlast(data.created, data.snapShot);
				},
				(err, eventRef) => {
					if (err) throw new Error("Cannot subscribe to dataService");

					this.eventRef = eventRef;
				}
			);
		} catch (error) {
			stateService.updateState({ service: name, state: "FAILED", error });
		}
	})();
};

/**
 * @summary Stop the component when Happner stops
 * @param {$happn} $happn
 * @returns {Promise}
 */
BlastService.prototype.componentStop = function($happn) {
	const { dataService } = $happn.event;
	const { stateService } = $happn.exchange;
	const { name } = $happn;

	return (async () => {
		stateService.updateState({ service: name, state: "STARTED" });
		dataService.off(this.eventRef);
	})();
};

/**
 * @summary Create a new blast
 * @param {$happn} $happn
 * @param {number} created
 * @param {*} snapShot
 * @returns {Promise}
 */
BlastService.prototype.createNewBlast = function($happn, created, snapShot) {
	const { blastService, blastRepository } = $happn.exchange;
	const { log } = $happn;
	const { env } = $happn.config;

	return (async () => {
		try {
			if (this.currentBlast) return log.error("Blast in progress - another fire button detected");

			this.currentBlast = {
				created: created,
				blastEvent: new BlastModel(snapShot, created, env.systemReportTime)
			};

			const currentBlast = { ...this.currentBlast };
			delete currentBlast.event;

			const { blastEvent } = currentBlast;
			log.info(`Creating new blast - ${blastEvent.data.id} - ${blastEvent.data.created}`);

			await blastRepository.upsertIndex(currentBlast);
			await blastRepository.set(currentBlast);
			blastService.blastTimer(true);

			await blastService.subscribeToBlast();
		} catch (err) {
			log.error("Error writing new blast object", err);
		}
	})();
};

/**
 * @summary Subcribe to the blast events
 * @param {$happn} $happn
 * @returns {Promise} void
 */
BlastService.prototype.subscribeToBlast = function($happn) {
	const { blastService } = $happn.exchange;
	const { log, event } = $happn;
	const { blastEvent } = this.currentBlast;

	return (async () => {
		try {
			blastEvent.event.on("BLAST_DATA_COMPLETE", () => {
				blastService.closeBlast();
			});

			blastEvent.event.on("BLAST_TIMER_COMPLETE", () => {
				blastService.closeBlast();
			});

			event.eventService.on(
				"UPDATE_LOG",
				async data => {
					await blastService.updateBlast(data);
				},
				(err, evRef) => {
					if (err) return log.error("Error subscribing to eventService", err);

					this.eventRefLog = evRef;
				}
			);

			event.eventService.on(
				"UPDATE_DET",
				data => {
					blastService.updateBlast(data);
				},
				(err, evRef) => {
					if (err) return log.error("Error subscribing to eventService", err);

					this.eventRefDet = evRef;
				}
			);
		} catch (err) {
			log.error("Error subscribing to Blast Model events", err);
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
			await this.currentBlast.blastEvent.addLog(logObj);

			const currentBlast = { ...this.currentBlast };
			delete currentBlast.event;
			await blastRepository.set(currentBlast);
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
BlastService.prototype.closeBlast = function($happn) {
	const { blastRepository, dataService, blastService } = $happn.exchange;
	const { emit, event, log } = $happn;

	return (async () => {
		try {
			if (!this.currentBlast) return null;

			log.info("Closing blast", this.currentBlast.blastEvent.data.id);

			const snapShot = await dataService.getSnapShot();
			await this.currentBlast.blastEvent.endBlast(snapShot);

			const currentBlast = { ...this.currentBlast };
			delete currentBlast.event;
			await blastRepository.set(currentBlast);

			blastService.reportTimer(false);
			emit("BLAST_COMPLETED", currentBlast);
			if (this.eventRefDet !== null) {
				event.eventService.off(this.eventRefDet, err => {
					if (err) {
						log.error("failed to unsubscribe from blast event", err);
						return;
					}

					this.eventRefDet = null;
				});
			}

			if (this.eventRefLog !== null) {
				event.eventService.off(this.eventRefLog, err => {
					if (err) return log.error("failed to unsubscribe from blast event", err);

					this.eventRefLog = null;
				});
			}

			this.currentBlast.blastEvent.event.removeAllListeners("BLAST_DATA_COMPLETE");
			this.currentBlast.blastEvent.event.removeAllListeners("BLAST_TIMER_COMPLETE");

			await blastRepository.upsertIndex(this.currentBlast);

			this.currentBlast = null;
		} catch (err) {
			log.error("Error writing new blast object", err);
		}
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
	const { error: logError } = $happn.log;

	return (async () => {
		try {
			const pdfUtils = new PdfUtil();
			const blastReport = await blastRepository.get(id);
			delete blastReport._meta;

			pdfUtils.createContent(blastReport);
			let pdfFile = await pdfUtils.createPdf(blastReport);
			return pdfFile;
		} catch (err) {
			logError("Error creating PDF", err);
		}
	})();
};

/**
 * @summary Timer used by UI to display the current Firing Time.
 * @param {$happn} $happn
 * @param {boolean} start - true to start - false to stop
 */
BlastService.prototype.blastTimer = function($happn, start) {
	const { emit, log } = $happn;
	const { env } = $happn.config;
	const { blastService } = $happn.exchange;

	let countdown = env.systemFiringTime;
	emit("BLAST_TIMER", countdown);
	log.info(`Blast Timer Started at ${countdown}ms`);

	if (start) {
		this.timer = setInterval(() => {
			if (countdown > 0) {
				countdown = countdown - 1000;
				emit("BLAST_TIMER", countdown);
			} else {
				clearInterval(this.timer);
				emit("BLAST_TIMER", 0);
				blastService.reportTimer(true);
			}
		}, 1000);
	} else {
		if (this.timer) {
			emit("BLAST_TIMER", 0);

			clearInterval(this.timer);
			this.timer = null;
		}
	}
};

/**
 * @summary <ul><li>Timer used by UI to display the current time left to compile the report</li>
 * <li>If there is no return data from the units which will close it off before that</li></ul><br>
 * @param {$happn} $happn
 * @param {number} start
 */
BlastService.prototype.reportTimer = function($happn, start) {
	const { emit, log } = $happn;
	const { env } = $happn.config;

	let countdown = env.systemReportTime - env.systemFiringTime;
	emit("REPORT_TIMER", countdown);

	if (start) {
		log.info(`Blast Timer Started at ${countdown}ms`);

		this._reportTimer = setInterval(() => {
			if (countdown > 1) {
				countdown = countdown - 1000;
				emit("REPORT_TIMER", countdown);
			} else {
				clearInterval(this._reportTimer);
				log.info(`Blast Timer Stopped`);
				emit("REPORT_TIMER", 0);
				this._reportTimer = null;
			}
		}, 1000);
	} else {
		log.info(`Blast Timer Stopped`);

		if (this._reportTimer) {
			emit("REPORT_TIMER", 0);
			clearInterval(this._reportTimer);
			this._reportTimer = null;
		}
	}
};

module.exports = BlastService;
