/* eslint-disable no-unused-vars */
const BlastModel = require("../models/blastModel");
const PdfUtil = require("../utils/pdfUtils");

function BlastService() {
	this.currentBlast = null;

	this.eventRefLog = null;
	this.eventRefDet = null;
	this.blastEventRef = null;
	this.blastTimerEventRef = null;
}

BlastService.prototype.start = function($happn) {
	const { log } = $happn;
	const { dataService } = $happn.event;
	const { blastService } = $happn.exchange;

	return (async () => {
		try {
			log.info("BlastService Started.......");
			dataService.on(
				"BLAST_STARTED",
				data => {
					blastService.createNewBlast(data.created, data.snapShot);
				},
				(err, eventRef) => {
					if (err) return log.error("Cannot subscribe to dataService");

					this.eventRef = eventRef;
				}
			);
		} catch (err) {
			log.error("Error starting Blast Service", err);
		}
	})();
};

BlastService.prototype.stop = function($happn) {
	const { log } = $happn;

	return (async () => {
		log.info("BlastService Stopped");
	})();
};

BlastService.prototype.createNewBlast = function($happn, created, snapShot) {
	const { blastService, blastRepository } = $happn.exchange;
	const { event, log } = $happn;
	const { env } = $happn.config;

	const subscribeToLogs = async () => {
		event.blastService.on(
			"BLAST_DATA_COMPLETE",
			() => {
				blastService.closeBlast();
			},
			(err, eventRef) => {
				if (err) return log.error("cannot subscribe to blast model");

				this.blastEventRef = eventRef;
			}
		);

		event.blastService.on(
			"BLAST_TIMER_COMPLETE",
			() => {
				blastService.closeBlast();
			},
			(err, eventRef) => {
				if (err) return log.error("cannot subscribe to blast model");

				this.blastTimerEventRef = eventRef;
			}
		);

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
	};

	const createNewBlastAsync = async () => {
		try {
			if (this.currentBlast)
				return log.error("Blast in progress - another fire button detected");

			this.currentBlast = {
				created: created,
				blastEvent: new BlastModel(
					$happn,
					snapShot,
					created,
					env.systemReportTime
				)
			};

			log.info(
				`Creating new blast - ${this.currentBlast.blastEvent.id} - ${this.currentBlast.blastEvent.created}`
			);

			await blastRepository.upsertIndex(this.currentBlast);
			await blastRepository.set(this.currentBlast);
			blastService.blastTimer(true);

			await subscribeToLogs();
		} catch (err) {
			log.error("Error writing new blast object", err);
		}
	};

	return createNewBlastAsync();
};

BlastService.prototype.blastTimer = function($happn, start) {
	const { emit, log } = $happn;
	const { env } = $happn.config;

	let countdown = env.systemFiringTime;
	emit("BLAST_TIMER", countdown);
	log.info(`Blast Timer Started at ${countdown}ms`);

	if (start) {
		this.timer = setInterval(() => {
			if (countdown > 0) {
				countdown = countdown - 1000;
				emit("BLAST_TIMER", countdown);
			}

			clearInterval(this.timer);
			emit("BLAST_TIMER", 0);
		}, 1000);
	} else {
		this.timer = null;
	}
};

BlastService.prototype.updateBlast = function($happn, logObj) {
	const { log } = $happn;
	const { blastRepository } = $happn.exchange;

	return (async () => {
		try {
			await this.currentBlast.blastEvent.addLog(logObj);
			await blastRepository.set(this.currentBlast);
		} catch (err) {
			log.error("Error writing new blast object", err);
		}
	})();
};

BlastService.prototype.closeBlast = function($happn) {
	const { blastRepository, dataService } = $happn.exchange;
	const { emit, event, log } = $happn;

	if (!this.currentBlast) return null;

	return (async () => {
		try {
			log.info("Closing blast", this.currentBlast.blastEvent.data.id);

			const snapShot = await dataService.getSnapShot();
			await this.currentBlast.blastEvent.endBlast(snapShot);
			await blastRepository.set(this.currentBlast);

			emit("BLAST_COMPLETED", this.currentBlast);
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
					if (err)
						return log.error("failed to unsubscribe from blast event", err);

					this.eventRefLog = null;
				});
			}

			if (this.blastEventRef !== null) {
				event.blastService.off(this.blastEventRef, err => {
					if (err)
						return log.error("failed to unsubscribe from blast event", err);

					this.blastEventRef = null;
				});
			}

			if (this.blastTimerEventRef !== null) {
				event.blastService.off(this.blastTimerEventRef, err => {
					if (err)
						return log.error("failed to unsubscribe from blast event", err);

					this.blastTimerEventRef = null;
				});
			}
			await blastRepository.upsertIndex(this.currentBlast);

			this.currentBlast = null;
		} catch (err) {
			log.error("Error writing new blast object", err);
		}
	})();
};

BlastService.prototype.pdfBlast = function($happn, blastId) {
	const { blastRepository } = $happn.exchange;
	const { error: logError } = $happn.log;

	return (async () => {
		try {
			const pdfUtils = new PdfUtil();
			const blastReport = await blastRepository.get(blastId);
			delete blastReport._meta;

			pdfUtils.createContent(blastReport);
			let pdfFile = await pdfUtils.createPdf(blastReport);
			return pdfFile;
		} catch (err) {
			logError("Error creating PDF", err);
		}
	})();
};

module.exports = BlastService;
