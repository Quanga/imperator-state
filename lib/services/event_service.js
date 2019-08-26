/* eslint-disable no-unused-vars */
var Queue = require("better-queue");
const PacketTemplate = require("../constants/packetTemplates");
const EventLog = require("../models/logModel");
const WarningModel = require("../models/warningModel");
const ipInt = require("ip-to-int");

function EventService() {
	this.__constants = new PacketTemplate();
	this.eventRef = null;
}

EventService.prototype.componentStart = function($happn) {
	const { stateService } = $happn.exchange;
	const { emit, name } = $happn;

	return (async () => {
		stateService.updateState({ service: name, state: "STARTED" });

		this.emitQueue = new Queue((task, cb) => {
			task.forEach(taskItem => {
				emit(taskItem.path, taskItem.value);
			});
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
			const { payload, typeId, createdAt, serial } = eventObj;

			let eventLog = new EventLog();
			eventLog.setId({ serial, typeId, createdAt });

			const reducedLogs = eventObj.hasOwnProperty("payload") ? this.reduceLogs(payload) : null;

			switch (eventObj.type) {
			case "EDD_SIG":
				eventLog.setType(eventObj.type);
				break;
			case "INSERT":
				{
					const { result, resultKeys } = reducedLogs;

					for (const rKey of resultKeys) {
						switch (rKey) {
						case "4":
							eventLog.setType("DET_INSERT");
							eventLog.setEvents(
								result[rKey].map(d => {
									return {
										serial: d.data.serial,
										windowId: d.data.windowId,
										ip: ipInt(d.data.serial).toIP()
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
					}
				}
				break;
			case "UPDATE":
				{
					const { result, resultKeys } = reducedLogs;

					for (const rKey of resultKeys) {
						switch (rKey) {
						case "4":
							eventLog.setType("DET_UPDATE");
							eventLog.setEvents(
								result[rKey].map(d => {
									return {
										serial: d.data.serial,
										windowId: d.data.windowId,
										diff: d.diff,
										ip: ipInt(d.data.serial).toIP()
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
					}
				}
				break;

			default:
				log.error("HandleEvent called with unknown TYPE", eventObj.type);
			}

			await logsRepository.set(eventLog);
			await eventService.processWarnings(eventLog);

			// this.emitQueue.push({
			// 	path: "UPDATE_LOG",
			// 	value: [eventObj]
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
	const { warningsRepository, eventService } = $happn.exchange;
	const { log } = $happn;

	const warnings = this.__constants.warnables;
	return (async () => {
		if (eventObj.hasOwnProperty("events") && eventObj.events.length > 0) {
			for (const event of eventObj.events) {
				if (!event.hasOwnProperty("diff")) return null;

				const diffKeys = Object.keys(event.diff);
				const loggableWarnings = diffKeys.filter(x => warnings.indexOf(x) !== -1);

				if (loggableWarnings && loggableWarnings.length > 0) {
					loggableWarnings.forEach(warn => {
						if (event.diff[warn] === 1) {
							const warning = new WarningModel(eventObj);
							warning.setWarning(warn);
							log.info(`Warning: Unit ${warning.serial} - ${warning.warning} has been issued`);
							eventService.persistWarning(warning);
						}
					});
				}

				// for (const diff of diffKeys) {
				// 	diff.filter()
				// }
			}
		}

		return warnings;
	})();
};

EventService.prototype.persistWarning = function($happn, warning) {
	console.log("SAVE WARNING", warning);
};

EventService.prototype.get = function($happn, from, to) {
	const { log } = $happn;
	const { logsRepository } = $happn.exchange;

	return (async () => {
		//const results =
	})();
};

module.exports = EventService;
