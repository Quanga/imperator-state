const BlastModel = require("../models/blastModel");

function BlastService() {
	this.currentBlast = null;
	this.firingTime = 2 * 60 * 1000; //2 minutes
	this.blastCloseTime = 3 * 60 * 1000; //3 minutes
	this.eventRef = null;
}

BlastService.prototype.start = function($happn) {
	const { info: logInfo } = $happn.log;

	return new Promise(resolve => {
		logInfo("BlastService Started");
		resolve();
	});
};

BlastService.prototype.getState = function($happn) {
	const { nodeRepository } = $happn.exchange;

	const getAllAsync = async () => {
		const nodeState = await nodeRepository.getAllNodes();
		const mapped = nodeState.map(unit => {
			return { data: unit.data, meta: unit.meta };
		});
		const toObj = mapped.reduce((acc, cur) => {
			acc[cur.data.path] = cur;
			return acc;
		}, {});

		return toObj;
	};

	return getAllAsync();
};

BlastService.prototype.createNewBlast = function($happn, created) {
	const { error: logError } = $happn.log;
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
			const state = await blastService.getState();
			this.currentBlast = {
				created: created,
				blastEvent: new BlastModel(state, created)
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
	const { blastService, blastRepository } = $happn.exchange;
	const { emit, event } = $happn;

	let createBlastAsync = async () => {
		try {
			const state = await blastService.getState();
			this.currentBlast.blastEvent.endBlast(state);
			await blastRepository.set(this.currentBlast);

			emit("BLAST_COMPLETE", this.currentBlast);

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

	return createBlastAsync();
};

module.exports = BlastService;
