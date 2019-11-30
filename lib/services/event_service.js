/* eslint-disable indent */
/* eslint-disable no-unused-vars */
var Queue = require("better-queue");
const PacketTemplate = require("../constants/packetTemplates");
const EventLog = require("../models/logModel");
const WarningModel = require("../models/warningModel");
//const ipInt = require("ip-to-int");

const {
	eventServiceEvents,
	blastServiceEvents,
	dataServiceEvents,
} = require("../constants/eventConstants");

const { eventServiceLogTypes } = require("../constants/typeConstants");

/**
 * @module lib/services/PacketService
 */

/**
 * @class EventService
 * @memberof module:lib/services/PacketService
 */
function EventService() {
	this.__constants = new PacketTemplate();
}

EventService.prototype.componentStart = function($happn) {
	const { emit } = $happn;

	return (async () => {
		this.emitQueue = new Queue((task, cb) => {
			emit(task.path, task.eventLog || task.warning);
			cb(task);
		});
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
			const { type } = eventObj;

			switch (type) {
				case "blastService/STATE":
					{
						// let eventLog = new EventLog();
						// eventLog.setId({
						// 	logType: "blast/log",
						// 	serial,
						// 	typeId,
						// 	createdAt,
						// });
						// eventLog.setBlastLog({ logType: eventObj.logType, msg: eventObj.msg });
						// await logsRepository.set(eventLog);
						// this.emitQueue.push({ path: eventServiceLogTypes.BLAST_EVENT, eventLog });
					}
					break;
				// case dataServiceEvents.UNIT_COUNT_CHANGED:
				// 	{
				// 		let eventLog = new EventLog();
				// 		eventLog.setId({
				// 			logType: eventServiceLogTypes.UNIT_COUNT,
				// 			serial,
				// 			typeId,
				// 			createdAt,
				// 		});
				// 		eventLog.setCounts(eventObj.counts);
				// 		this.emitQueue.push({ path: eventServiceEvents.UPDATE_LOG, eventLog });
				// 	}
				// 	break;
				case "dataService/SIGNAL":
					{
						// let eventLog = new EventLog();
						// eventLog.setId({
						// 	logType: eventServiceLogTypes.EDD_SIG,
						// 	serial,
						// 	typeId,
						// 	createdAt,
						// });
						// await logsRepository.set(eventLog);
						// this.emitQueue.push({ path: eventServiceEvents.UPDATE_LOG, eventLog });
					}
					break;
				case "dataService/UNITS_INSERTED":
					{
						this.emitQueue.push({ path: eventServiceEvents.UPDATE_LOG, eventObj });

						await logsRepository.set(eventObj);
						await eventService.processWarnings(eventObj);
					}
					break;
				case "dataService/UNITS_UPDATED":
					{
						this.emitQueue.push({ path: eventServiceEvents.UPDATE_LOG, eventObj });
						await logsRepository.set(eventObj);
						await eventService.processWarnings(eventObj);
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
			if (Object.prototype.hasOwnProperty.call(eventObj, "events") && eventObj.events.length > 0) {
				for (const event of eventObj.events) {
					if (Object.prototype.hasOwnProperty.call(event, "diff") && event.diff !== null) {
						const diffKeys = Object.keys(event.diff);
						const warnKeys = Object.keys(warnings);
						const loggableWarnings = diffKeys.filter(x => warnKeys.indexOf(x) !== -1);

						if (loggableWarnings && loggableWarnings.length > 0) {
							loggableWarnings.forEach(warn => {
								if (event.diff[warn] === warnings[warn]) {
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
		return;
		// const { msgObj, error } = errorObj;
		// const { createdAt } = msgObj;
		// await logsRepository.setPacketLog({
		// 	createdAt: createdAt ? createdAt : Date.now(),
		// 	msgObj,
		// 	error
		// });
	})();
};

EventService.prototype.getPacketError = function($happn, path, from, to) {
	const { logsRepository } = $happn.exchange;

	return (async () => {
		let res = await logsRepository.getPacketLog(path);
		return res;
	})();
};

/*
this.client.exchange.eventService.acknowledgeWarning(
	id,
	username,
	createdAt,
  ),
  */

EventService.prototype.acknowledgeWarning = function($happn, id, username, createdAt) {
	const { log } = $happn;
	const { warningsRepository } = $happn.exchange;

	return (async () => {
		let rec;
		const record = await warningsRepository.getById(id);
		if (!Array.isArray(record) && rec.length === 0) throw new Error("no record found");
		rec = record[0];

		rec.ack = true;
		rec.ackBy = username;
		rec.ackDate = createdAt;
		rec.ackType = "user";
		delete record._meta;
		//console.log("GETTING", rec);

		let response = await warningsRepository.set(rec);
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
