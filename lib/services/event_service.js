/* eslint-disable no-unused-vars */
var Queue = require("better-queue");
const PacketTemplate = require("../constants/packetTemplates");
const EventLog = require("../models/logModel");
const WarningModel = require("../models/warningModel");
const ipInt = require("ip-to-int");

const {
	eventServiceLogTypes,
	eventServiceEvents,
	blastServiceEvents,
	dataServiceEvents
} = require("../constants/eventConstants");
const { componentStates } = require("../constants/stateConstants");

function EventService() {
	this.__constants = new PacketTemplate();
}

EventService.prototype.componentStart = function($happn) {
	const { stateService } = $happn.exchange;
	const { emit, name } = $happn;

	return (async () => {
		stateService.updateState({ service: name, state: componentStates.STARTED });

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
		stateService.updateState({ service: name, state: componentStates.STOPPED });
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
			case blastServiceEvents.BLAST_LOG:
				{
					let eventLog = new EventLog();
					eventLog.setId({
						logType: eventServiceLogTypes.BLAST_EVENT,
						serial,
						typeId,
						createdAt
					});

					eventLog.setBlastLog({ logType: eventObj.logType, msg: eventObj.msg });
					await logsRepository.set(eventLog);

					this.emitQueue.push({ path: eventServiceLogTypes.BLAST_EVENT, eventLog });
				}
				break;
			case dataServiceEvents.UNIT_COUNT_CHANGED:
				{
					let eventLog = new EventLog();
					eventLog.setId({ logType: eventServiceLogTypes.UNIT_COUNT, serial, typeId, createdAt });
					eventLog.setCounts(eventObj.counts);
					this.emitQueue.push({ path: eventServiceEvents.UPDATE_LOG, eventLog });
				}
				break;
			case dataServiceEvents.EDD_SIGNAL_DETECTED:
				{
					let eventLog = new EventLog();
					eventLog.setId({ logType: eventServiceLogTypes.EDD_SIG, serial, typeId, createdAt });
					await logsRepository.set(eventLog);
					this.emitQueue.push({ path: eventServiceEvents.UPDATE_LOG, eventLog });
				}
				break;
			case dataServiceEvents.UNITS_INSERTED:
				{
					const { result, resultKeys } = reducedLogs;

					for (const rKey of resultKeys) {
						let eventLog = new EventLog();
						switch (rKey) {
						case "4":
							eventLog.setId({
								logType: eventServiceLogTypes.DET_INSERT,
								serial,
								typeId,
								createdAt
							});
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
							eventLog.setId({
								logType: eventServiceLogTypes.UNIT_INSERT,
								serial,
								typeId,
								createdAt
							});
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
						this.emitQueue.push({ path: eventServiceEvents.UPDATE_LOG, eventLog });

						await logsRepository.set(eventLog);
						await eventService.processWarnings(eventLog);
					}
				}
				break;
			case dataServiceEvents.UNITS_UPDATED:
				{
					const { result, resultKeys } = reducedLogs;

					for (const rKey of resultKeys) {
						let eventLog = new EventLog();
						switch (rKey) {
						case "4":
							eventLog.setId({
								logType: eventServiceLogTypes.DET_UPDATE,
								serial,
								typeId,
								createdAt
							});
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
							eventLog.setId({
								logType: eventServiceLogTypes.UNIT_UPDATE,
								serial,
								typeId,
								createdAt
							});
							eventLog.setEvents(
								result[rKey].map(d => {
									return { serial: d.data.serial, diff: d.diff };
								})
							);
							break;
						}

						this.emitQueue.push({ path: eventServiceEvents.UPDATE_LOG, eventLog });

						await logsRepository.set(eventLog);
						await eventService.processWarnings(eventLog);
					}
				}
				break;

			default:
				log.error("HandleEvent called with unknown TYPE", eventObj.type);
			}
		} catch (err) {
			log.error(err);
		}
	})();
};

EventService.prototype.processWarnings = function($happn, eventObj) {
	const { warningsRepository } = $happn.exchange;
	const { log } = $happn;

	const warnings = this.__constants.warnables;

	return (async () => {
		try {
			if (eventObj.hasOwnProperty("events") && eventObj.events.length > 0) {
				for (const event of eventObj.events) {
					if (event.hasOwnProperty("diff") && event.diff !== null) {
						const diffKeys = Object.keys(event.diff);
						const loggableWarnings = diffKeys.filter(x => warnings.indexOf(x) !== -1);

						if (loggableWarnings && loggableWarnings.length > 0) {
							loggableWarnings.forEach(warn => {
								if (event.diff[warn] === 1) {
									const warning = new WarningModel(eventObj);
									warning.setWarning(warn);
									log.info(`Warning: Unit ${warning.serial} - ${warning.warning} has been issued`);
									this.emitQueue.push({ path: eventServiceEvents.WARNING_LOG, warning });
									warningsRepository.set(warning);
								}
							});
						}
					}
				}
			}
		} catch (error) {
			log.error(error);
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

EventService.prototype.getLogs = function($happn, path, from, to) {
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

EventService.prototype.acknowledgeWarning = function($happn, id, username, createdAt) {
	//const { log } = $happn;
	const { warningsRepository } = $happn.exchange;

	return (async () => {
		let record = warningsRepository.getById(id);
		const parsedRecord = JSON.parse(record);
		parsedRecord.ack = true;
		parsedRecord.ackBy = username;
		parsedRecord.ackDate = createdAt;
		parsedRecord.ackType = "user";

		let response = await warningsRepository.set(parsedRecord);
		return response;
	})();
};

module.exports = EventService;

/*
class WarningModel {
	constructor(eventObj) {
		this.createdAt = eventObj.createdAt;
		this.serial = eventObj.serial;
		this.typeId = eventObj.typeId;
		this.ack = false;
	}

	setWarning(warning) {
		this.id = uuid.v4();
		this.warning = warning;
		this.ackDate = null;
		this.ackBy = null;
		this.ackType = null;
	}
}
*/
