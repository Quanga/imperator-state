/* eslint-disable no-unused-vars */
const BlastModel = require("../models/blastModel");

function BlastService() {
	this.currentBlast = null;
	this.firingTime = process.env.SYSTEM_FIRING_TIME || 2 * 60 * 1000; //2 minutes
	this.blastCloseTime = process.env.SYSTEM_REPORT_TIME || 3 * 60 * 1000; //3 minutes
	this.eventRef = null;
}

BlastService.prototype.start = function($happn) {
	const { info: logInfo, error: logError } = $happn.log;
	const { dataService } = $happn.event;
	const { blastService } = $happn.exchange;

	return new Promise(resolve => {
		logInfo("BlastService Started");
		dataService.on(
			"BLAST_STARTED",
			(data, meta) => {
				blastService.createNewBlast(data.created, data.snapShot);
			},
			(err, eventRef) => {
				if (err) {
					logError("Cannot subscribe to dataService");
				}
				this.eventRef = eventRef;
			}
		);
		resolve();
	});
};

BlastService.prototype.stop = function($happn) {
	const { info: logInfo } = $happn.log;

	return new Promise(resolve => {
		logInfo("BlastService Stopped");
		resolve();
	});
};

BlastService.prototype.createNewBlast = function($happn, created, snapShot) {
	const { error: logError, warn: logWarn } = $happn.log;
	const { blastService, blastRepository } = $happn.exchange;
	const { event, emit } = $happn;

	const subscribeLogs = () => {
		event.eventService.on(
			"log",
			data => {
				blastService.updateBlast(data);
			},
			(err, evRef) => {
				if (err) return logError("Error subscribing to eventService", err);

				this.eventRef = evRef;
			}
		);
	};

	const createNewBlastAsync = async () => {
		try {
			if (this.currentBlast) {
				logWarn("Blast in progress - another fire button detected");
				return;
			}
			//const state = await blastService.getState();

			this.currentBlast = {
				created: created,
				blastEvent: new BlastModel(snapShot, created)
			};
			await blastRepository.setIndex(this.currentBlast);
			await blastRepository.set(this.currentBlast);

			subscribeLogs();
			blastService.startBlastTimer(this.blastCloseTime);
			emit("BLAST_STARTED", this.currentBlast);
		} catch (err) {
			logError("Error writing new blast object", err);
		}
	};

	return createNewBlastAsync();
};

BlastService.prototype.startBlastTimer = function($happn, duration) {
	const { blastService } = $happn.exchange;
	const timer = () =>
		new Promise(resolve => {
			setTimeout(() => {
				resolve();
			}, duration);
		});

	const startAsync = async () => {
		await timer();
		await blastService.closeBlast();
	};

	return startAsync();
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
	const { error: logError } = $happn.log;
	const { blastRepository, dataService } = $happn.exchange;
	const { emit, event } = $happn;

	let closeBlastAsync = async () => {
		try {
			const snapShot = await dataService.getSnapShot();
			await this.currentBlast.blastEvent.endBlast(snapShot);
			await blastRepository.set(this.currentBlast);

			emit("BLAST_COMPLETE", this.currentBlast);
			this.currentBlast = null;
			if (this.eventRef !== null) {
				event.eventService.off(this.eventRef, err => {
					if (err) {
						logError("failed to unsubscribe from blast event", err);
						return;
					}

					this.eventRef = null;
				});
			}
		} catch (err) {
			logError("Error writing new blast object", err);
		}
	};

	return closeBlastAsync();
};

module.exports = BlastService;
