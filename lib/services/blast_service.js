/* eslint-disable no-unused-vars */
const BlastModel = require("../models/blastModel");
const PdfUtil = require("../utils/pdfUtils");

function BlastService() {
	this.currentBlast = null;

	this.eventRefLog = null;
	this.eventRefDet = null;
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
		this.currentBlast.blastEvent.event.on("BLAST_DATA_COMPLETE", () => {
			blastService.closeBlast();
		});

		this.currentBlast.blastEvent.event.on("BLAST_TIMER_COMPLETE", () => {
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
	};

	return (async () => {
		try {
			if (this.currentBlast) return log.error("Blast in progress - another fire button detected");

			this.currentBlast = {
				created: created,
				blastEvent: new BlastModel(snapShot, created, env.systemReportTime)
			};

			const currentBlast = { ...this.currentBlast };
			delete currentBlast.event;

			log.info(
				`Creating new blast - ${currentBlast.blastEvent.data.id} - ${currentBlast.blastEvent.data.created}`
			);

			await blastRepository.upsertIndex(currentBlast);
			await blastRepository.set(currentBlast);
			blastService.blastTimer(true);

			await subscribeToLogs();
		} catch (err) {
			log.error("Error writing new blast object", err);
		}
	})();
};

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

BlastService.prototype.reportTimer = function($happn, start) {
	const { emit, log } = $happn;
	const { env } = $happn.config;

	let countdown = env.systemReportTime - env.systemFiringTime;
	emit("REPORT_TIMER", countdown);
	log.info(`Blast Timer Started at ${countdown}ms`);

	if (start) {
		this.reportTimer = setInterval(() => {
			if (countdown > 0) {
				countdown = countdown - 1000;
				emit("REPORT_TIMER", countdown);
			} else {
				clearInterval(this.reportTimer);
				emit("REPORT_TIMER", 0);
			}
		}, 1000);
	} else {
		if (this.reportTimer) {
			emit("REPORT_TIMER", 0);
			clearInterval(this.reportTimer);
			this.reportTimer = null;
		}
	}
};

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

BlastService.prototype.closeBlast = function($happn) {
	const { blastRepository, dataService, blastService } = $happn.exchange;
	const { emit, event, log } = $happn;

	if (!this.currentBlast) return null;

	return (async () => {
		try {
			log.info("Closing blast", this.currentBlast.blastEvent.data.id);

			const snapShot = await dataService.getSnapShot();
			await this.currentBlast.blastEvent.endBlast(snapShot);

			const currentBlast = { ...this.currentBlast };
			delete currentBlast.event;
			await blastRepository.set(currentBlast);

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
			blastService.reportTimer(false);

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

module.exports = BlastService;
