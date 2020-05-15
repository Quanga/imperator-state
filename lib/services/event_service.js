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
class EventService {
	constructor() {
		this.__constants = new PacketTemplate();
		this.dataServiceEventRef = null;
	}

	async componentStart($happn) {
		const { emit } = $happn;
		const { eventService } = $happn.exchange;
		const { dataService, blastService } = $happn.event;

		dataService.on(
			"log",
			(data) => eventService.handleEvent(data),
			(error, _eventRef) => {
				if (error) throw new Error("Failed to subscribe to dataService event");
				this.dataServiceEventRef = _eventRef;
			},
		);
		blastService.on(
			"log",
			(data) => {
				eventService.handleEvent(data);
			},
			(error, _eventRef) => {
				if (error) throw new Error("Failed to subscribe to blastService event");
				this.blastSeriveEventRef = _eventRef;
			},
		);
		this.emitQueue = new Queue((task, cb) => {
			emit(task.path, task.eventObj || task.warning);
			cb(task);
		});
	}

	async componentStop($happn) {
		const { dataService, blastService } = $happn.event;

		dataService.off(this.dataServiceEventRef, (error) => {
			if (error) throw new Error("Failed to unsubscribe from dataService event");
			this.dataServiceEventRef = undefined;
		});
		blastService.off(this.blastSeriveEventRef, (error) => {
			if (error) throw new Error("Failed to unsubscribe from blastService event");
			this.dataServiceEventRef = undefined;
		});
	}

	/**
	 * @summary Handles the emitting of the Data Service Events to other services
	 * @param {$happn} $happn
	 * @param {object} updates - eventObj
	 */
	async handleEvent($happn, eventObj) {
		const { logsRepository, eventService } = $happn.exchange;
		const { log } = $happn;
		/*
        { meta:
             { createdAt: 1575436835235,
             logType: 'dataService/UNITS_INSERTED',
             serial: 13,
            typeId: 3 },
          data: { events: { '4': [Array] } } }
        */
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
				case "dataService/UNITS_UPDATE":
					await logsRepository.set(eventObj);
					this.emitQueue.push({ path: "UNIT_UPDATE", eventObj });
					await eventService.processWarnings(eventObj);
					break;
				case "dataService/UNITS_INSERT":
					await logsRepository.set(eventObj);
					this.emitQueue.push({ path: "UNIT_INSERT", eventObj });
					await eventService.processWarnings(eventObj);
					break;
				default:
					log.error("HandleEvent called with unknown TYPE", eventObj.type);
			}
		} catch (err) {
			log.error(err);
		}
	}

	async processWarnings($happn, eventObj) {
		const { warningsRepository } = $happn.exchange;
		const { log } = $happn;
		const warnings = this.__constants.warnables;
		const extractWarning = (event, warn) => {
			if (event.diffs[warn] === warnings[warn]) {
				const warning = new WarningModel(eventObj);
				warning.setWarning(warn);
				log.info(`[WARNING ISSUED] ${warning.serial} - ${warning.warning} has been issued`);
				this.emitQueue.push({ path: eventServiceEvents.WARNING_LOG, warning });
				warningsRepository.set(warning);
			}
		};

		try {
			if (!Object.prototype.hasOwnProperty.call(eventObj.data, "events")) return;
			const { events } = eventObj.data;
			if (Object.keys(events).length === 0) return;
			Object.keys(events).forEach((typeId) => {
				events[typeId].forEach((event) => {
					if (Object.prototype.hasOwnProperty.call(event, "diffs") && event.diffs !== null) {
						const loggableWarnings = Object.keys(event.diffs).filter(
							(x) => Object.keys(warnings).indexOf(x) !== -1,
						);
						if (loggableWarnings && loggableWarnings.length > 0) {
							loggableWarnings.forEach((warn) => extractWarning(event, warn));
						}
					}
				});
			});
		} catch (error) {
			log.error(error);
		}
	}

	/*
    this.client.exchange.eventService.acknowledgeWarning(
        id,
        username,
        createdAt,
      ),
      */
	async acknowledgeWarning($happn, id, username, createdAt) {
		const { log } = $happn;
		const { warningsRepository } = $happn.exchange;

		let rec;
		const record = await warningsRepository.getById(id);
		if (!Array.isArray(record) && rec.length === 0) throw new Error("no record found");
		rec = record[0];
		rec.ack = true;
		rec.ackBy = username;
		rec.ackDate = createdAt;
		rec.ackType = "user";
		delete record._meta;
		let response = await warningsRepository.set(rec);
		return response;
	}
}

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
