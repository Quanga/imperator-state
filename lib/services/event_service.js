/* eslint-disable indent */
/* eslint-disable no-unused-vars */
var Queue = require("better-queue");
const PacketTemplate = require("../constants/packetTemplates");
const WarningModel = require("../models/warningModel");

/**
 * @module lib/services/PacketService
 */
const { eventServiceEvents } = require("../constants/eventConstants");

/**
 * @class EventService
 * @memberof module:lib/services/PacketService
 */
function EventService() {
	this.__constants = new PacketTemplate();
	this.dataServiceEventRef = null;
}

EventService.prototype.componentStart = function($happn) {
	const { emit } = $happn;
	const { eventService } = $happn.exchange;
	const { dataService } = $happn.event;
	/*
{ meta:
   { createdAt: 1575436835235,
     logType: 'dataService/UNITS_INSERTED',
     serial: 13,
     typeId: 3 },
  data: { events: { '4': [Array] } } }
*/
	return (async () => {
		dataService.on(
			"log",
			data => eventService.handleEvent(data),
			(error, _eventRef) => {
				if (error) throw new Error("Failed to subscribe to dataService event");

				this.dataServiceEventRef = _eventRef;
			},
		);

		this.emitQueue = new Queue((task, cb) => {
			emit(task.path, task.eventObj || task.warning);
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
			switch (eventObj.meta.logType) {
				case "blastService/STATE":
					await logsRepository.set(eventObj);
					this.emitQueue.push({ path: "eventService/BLAST_EVENT", eventObj });
					break;

				case "dataService/SIGNAL":
					await logsRepository.set(eventObj);
					this.emitQueue.push({ path: "eventService/UNIT_UPDATE", eventObj });
					break;

				case "dataService/UNITS_UPDATED":
					this.emitQueue.push({ path: "eventService/UNIT_UPDATE", eventObj });
					await logsRepository.set(eventObj);
					await eventService.processWarnings(eventObj);
					break;

				case "dataService/UNITS_INSERTED":
					this.emitQueue.push({ path: "eventService/UNIT_UPDATE", eventObj });
					await logsRepository.set(eventObj);
					await eventService.processWarnings(eventObj);
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
