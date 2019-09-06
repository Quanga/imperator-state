/* eslint-disable no-unused-vars */
var Queue = require("better-queue");
const PacketTemplate = require("../constants/packetTemplates");
const EventLog = require("../models/logModel");
const WarningModel = require("../models/warningModel");
const ipInt = require("ip-to-int");

function EventService() {
	this.__constants = new PacketTemplate();
}

EventService.prototype.componentStart = function($happn) {
	const { stateService } = $happn.exchange;
	const { emit, name } = $happn;

	return (async () => {
		stateService.updateState({ service: name, state: "STARTED" });

		this.emitQueue = new Queue((task, cb) => {
			emit(task.path, task.eventLog);
			cb(task);
		});
	})();
};

EventService.prototype.componentStop = function($happn) {
	const { stateService } = $happn.exchange;
	const { name } = $happn;

	return (async () => {
		stateService.updateState({ service: name, state: "STOPPED" });
	})();
};

/**
 * @summary Handles the emitting of the Data Service Events to other services
 * @param {$happn} $happn
 * @param {object} updates - eventObj
 */
EventService.prototype.handleEvent = function($happn, eventObj) {
	const { logsRepository, eventService } = $happn.exchange;
	const { log } = $happn;

	return (async () => {
		try {
			const { payload, typeId, createdAt, serial, type } = eventObj;

			const reducedLogs = eventObj.hasOwnProperty("payload") ? this.reduceLogs(payload) : null;

			switch (type) {
			case "UNIT_COUNT":
				{
					let eventLog = new EventLog();
					eventLog.setId({ serial, typeId, createdAt });

					eventLog.setType("UNIT_COUNT");
					eventLog.setCounts(eventObj.counts);
					this.emitQueue.push({ path: "UPDATE_LOG", eventLog });
				}
				break;
			case "EDD_SIG":
				{
					let eventLog = new EventLog();
					eventLog.setId({ serial, typeId, createdAt });

					eventLog.setType("EDD_SIG");
					await logsRepository.set(eventLog);

					this.emitQueue.push({ path: "UPDATE_LOG", eventLog });
				}
				break;
			case "INSERT":
				{
					const { result, resultKeys } = reducedLogs;

					for (const rKey of resultKeys) {
						let eventLog = new EventLog();
						eventLog.setId({ serial, typeId, createdAt });
						switch (rKey) {
						case "4":
							eventLog.setType("DET_INSERT");
							eventLog.setEvents(
								result[rKey].map(d => {
									return {
										serial: d.data.serial,
										windowId: d.data.windowId,
										ip: d.data.serial ? ipInt(d.data.serial).toIP() : null
									};
								})
							);
							break;
						default:
							eventLog.setType("UNIT_INSERT");
							if (result[rKey].length > 0) {
								const diffs = result[rKey].filter(u => u.hasOwnProperty("diff"));
								if (diffs.length > 0) {
									eventLog.setEvents(
										diffs.map(d => {
											return { diff: d.diff };
										})
									);
								}
							}
							break;
						}
						this.emitQueue.push({ path: "UPDATE_LOG", eventLog });

						await logsRepository.set(eventLog);
						await eventService.processWarnings(eventLog);
					}
				}
				break;
			case "UPDATE":
				{
					const { result, resultKeys } = reducedLogs;

					for (const rKey of resultKeys) {
						let eventLog = new EventLog();
						eventLog.setId({ serial, typeId, createdAt });
						switch (rKey) {
						case "4":
							eventLog.setType("DET_UPDATE");
							eventLog.setEvents(
								result[rKey].map(d => {
									return {
										serial: d.data.serial,
										windowId: d.data.windowId,
										diff: d.diff,
										ip: d.data.serial ? ipInt(d.data.serial).toIP() : "none"
									};
								})
							);
							break;
						default:
							eventLog.setType("UNIT_UPDATE");
							eventLog.setEvents(
								result[rKey].map(d => {
									return { serial: d.data.serial, diff: d.diff };
								})
							);
							break;
						}
						this.emitQueue.push({ path: "UPDATE_LOG", eventLog });

						await logsRepository.set(eventLog);
						await eventService.processWarnings(eventLog);
					}
				}
				break;

			default:
				log.error("HandleEvent called with unknown TYPE", eventObj.type);
			}

			//console.log(eventObj);
		} catch (err) {
			log.error(err);
		}
	})();
};

EventService.prototype.reduceLogs = function(payload) {
	let result = payload.reduce((acc, cur) => {
		if (!acc.hasOwnProperty(cur.data.typeId)) {
			acc[cur.data.typeId] = [];
		}

		acc[cur.data.typeId].push(cur);
		return acc;
	}, {});

	return { result, resultKeys: Object.keys(result) };
};

EventService.prototype.processWarnings = function($happn, eventObj) {
	const { warningsRepository } = $happn.exchange;
	const { log } = $happn;

	const warnings = this.__constants.warnables;
	return (async () => {
		if (eventObj.hasOwnProperty("events") && eventObj.events.length > 0) {
			for (const event of eventObj.events) {
				if (event.hasOwnProperty("diff") && event.diff !== null) {
					const diffKeys = Object.keys(event.diff);
					const loggableWarnings = diffKeys.filter(x => warnings.indexOf(x) !== -1);

					if (loggableWarnings && loggableWarnings.length > 0) {
						loggableWarnings.forEach(async warn => {
							if (event.diff[warn] === 1) {
								const warning = new WarningModel(eventObj);
								warning.setWarning(warn);
								log.info(`Warning: Unit ${warning.serial} - ${warning.warning} has been issued`);
								await warningsRepository.set(warning);
							}
						});
					}
				}
			}
		}
	})();
};

EventService.prototype.get = function($happn, from, to) {
	const { log } = $happn;
	const { logsRepository } = $happn.exchange;

	return (async () => {
		//const results =
	})();
};

EventService.prototype.logPacketError = function($happn, errorObj) {
	const { logsRepository } = $happn.exchange;

	return (async () => {
		const { msgObj, error } = errorObj;
		const { createdAt } = msgObj;
		await logsRepository.setPacketLog({
			createdAt: createdAt ? createdAt : Date.now(),
			msgObj,
			error
		});
	})();
};

EventService.prototype.getPacketError = function($happn, path, from, to) {
	const { logsRepository } = $happn.exchange;

	return (async () => {
		let res = await logsRepository.getPacketLog(path);
		return res;
	})();
};

module.exports = EventService;
