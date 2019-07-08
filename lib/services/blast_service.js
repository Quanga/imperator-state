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
	const { info: logInfo, error: logError } = $happn.log;
	const { dataService } = $happn.event;
	const { blastService } = $happn.exchange;

	return new Promise(resolve => {
		logInfo("BlastService Started");
		dataService.on(
			"BLAST_STARTED",
			data => {
				blastService.createNewBlast(data.created, data.snapShot);
			},
			(err, eventRef) => {
				if (err) {
					logError("Cannot subscribe to dataService");
				}
				this.eventRef = eventRef;
				resolve();
			}
		);
	});
};

BlastService.prototype.stop = function($happn) {
	const { info: logInfo } = $happn.log;

	return (async () => {
		logInfo("BlastService Stopped");
	})();
};

BlastService.prototype.createNewBlast = function($happn, created, snapShot) {
	const { error: logError, warn: logWarn, info: logInfo } = $happn.log;
	const { blastService, blastRepository } = $happn.exchange;
	const { event } = $happn;
	const { env } = $happn.config;

	const subscribeToLogs = async () => {
		event.blastService.on(
			"BLAST_DATA_COMPLETE",
			() => {
				blastService.closeBlast();
			},
			(err, eventRef) => {
				if (err) {
					logError("cannot subscribe to blast model");
				}
				this.blastEventRef = eventRef;
			}
		);

		event.blastService.on(
			"BLAST_TIMER_COMPLETE",
			() => {
				blastService.closeBlast();
			},
			(err, eventRef) => {
				if (err) {
					logError("cannot subscribe to blast model");
				}
				this.blastTimerEventRef = eventRef;
			}
		);

		event.eventService.on(
			"UPDATE_LOG",
			async data => {
				await blastService.updateBlast(data);
			},
			(err, evRef) => {
				if (err) return logError("Error subscribing to eventService", err);

				this.eventRefLog = evRef;
			}
		);

		event.eventService.on(
			"UPDATE_DET",
			data => {
				blastService.updateBlast(data);
			},
			(err, evRef) => {
				if (err) return logError("Error subscribing to eventService", err);

				this.eventRefDet = evRef;
			}
		);
	};

	const createNewBlastAsync = async () => {
		try {
			if (this.currentBlast)
				return logWarn("Blast in progress - another fire button detected");

			this.currentBlast = {
				created: created,
				blastEvent: new BlastModel(
					$happn,
					snapShot,
					created,
					env.systemReportTime
				)
			};

			logInfo(`Creating new blast - ${this.currentBlast.blastEvent.id}`);

			await blastRepository.setIndex(this.currentBlast);
			await blastRepository.set(this.currentBlast);

			await subscribeToLogs();
		} catch (err) {
			logError("Error writing new blast object", err);
		}
	};

	return createNewBlastAsync();
};

BlastService.prototype.updateBlast = function($happn, logObj) {
	const { error: logError } = $happn.log;
	const { blastRepository } = $happn.exchange;

	let createBlastAsync = async () => {
		try {
			await this.currentBlast.blastEvent.addLog(logObj);
			await blastRepository.set(this.currentBlast);
		} catch (err) {
			logError("Error writing new blast object", err);
		}
	};

	return createBlastAsync();
};

BlastService.prototype.closeBlast = function($happn) {
	const { error: logError, info: logInfo } = $happn.log;
	const { blastRepository, dataService } = $happn.exchange;
	const { emit, event } = $happn;

	if (!this.currentBlast) return null;

	let closeBlastAsync = async () => {
		try {
			logInfo("Closing blast", this.currentBlast.blastEvent.data.id);

			const snapShot = await dataService.getSnapShot();
			await this.currentBlast.blastEvent.endBlast(snapShot);
			await blastRepository.set(this.currentBlast);

			emit("BLAST_COMPLETED", this.currentBlast);
			if (this.eventRefDet !== null) {
				event.eventService.off(this.eventRefDet, err => {
					if (err) {
						logError("failed to unsubscribe from blast event", err);
						return;
					}

					this.eventRefDet = null;
				});
			}

			if (this.eventRefLog !== null) {
				event.eventService.off(this.eventRefLog, err => {
					if (err) {
						logError("failed to unsubscribe from blast event", err);
						return;
					}

					this.eventRefLog = null;
				});
			}

			if (this.blastEventRef !== null) {
				event.blastService.off(this.blastEventRef, err => {
					if (err) {
						logError("failed to unsubscribe from blast event", err);
						return;
					}

					this.blastEventRef = null;
				});
			}

			if (this.blastTimerEventRef !== null) {
				event.blastService.off(this.blastTimerEventRef, err => {
					if (err) {
						logError("failed to unsubscribe from blast event", err);
						return;
					}

					this.blastTimerEventRef = null;
				});
			}
			this.currentBlast = null;
		} catch (err) {
			logError("Error writing new blast object", err);
		}
	};

	return closeBlastAsync();
};

BlastService.prototype.pdfBlast = function($happn, blastId) {
	const { blastRepository } = $happn.exchange;

	const pdfBlastAsync = async () => {
		const pdfUtils = new PdfUtil();
		const blastReport = await blastRepository.get(blastId);
		delete blastReport._meta;

		pdfUtils.createContent(blastReport);
		let pdfFile = await pdfUtils.createPdf(blastReport);
		return pdfFile;
	};

	return pdfBlastAsync();
};

module.exports = BlastService;
