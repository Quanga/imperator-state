/* eslint-disable no-unused-vars */
const clone = require("clone");
const uuid = require("uuid");

const EventLog = require("../models/logModel");
const BlastModel = require("../models/blastModel");

const modes = require("../configs/modes/modes");

const fields = require("../configs/fields/fieldConstants");
const { typeId, createdAt } = fields;

/**
 * @module lib/services/blastService
 */
/**
 * @class BlastService
 * @requires BlastModel
 * @requires pdfUtils
 * @property {object} this.currentBlast  The active current Blast
 */
class BlastService {
	constructor() {
		this.currentBlast = null;
		this.eventRefLog = null;
		this.dataServiceEventRefs = [];
	}
	//#region Startup Component
	/**
	 *  <ul><li>Start the component when Happner starts.</li>
	 * <li> Starts a listener for a BLAST_STARTED event emitted from the dataService</li></ul><br>
	 * @param {$happn} $happn
	 * @returns {Promise}
	 */
	async componentStart($happn) {
		const { blastService } = $happn.exchange;
		const { log } = $happn;

		try {
			await blastService.subscribeToDataModel();
		} catch (error) {
			log.error(error);
		}
	}

	async subscribeToDataModel($happn) {
		const { blastService } = $happn.exchange;
		const { dataService } = $happn.event;
		const { log } = $happn;

		try {
			dataService.on(
				"state",
				(data) => {
					if (data[typeId] === 0) {
						switch (data.state.operation) {
							case "firing":
								blastService.createNewBlast(data[createdAt]);
								break;
							case "firing_aborted":
								blastService.closeBlast();
								break;
							case "firing_complete":
								this.currentBlast.toggleState(data);
								break;
							default:
								break;
						}
					}
				},
				(error, _eventRef) => {
					if (error) {
						log.error("Cannot subscribe to dataService component");
						log.error(error);
						return;
					}
					this.dataServiceEventRefs.push(_eventRef);
				},
			);
		} catch (error) {
			log.error(error);
		}
	}

	/**
	 * @summary Stop the component when Happner stops
	 * @param {$happn} $happn
	 * @returns {Promise}
	 */
	async componentStop($happn) {
		const { dataService, eventService } = $happn;

		if (this.eventRefLog) {
			eventService.off(this.eventRefLog, (error) => {
				if (error) {
					throw new Error("Cannot unsubscribe from eventService event");
				}
			});
		}
		this.dataServiceEventRefs.forEach((ref) =>
			dataService.off(ref, (error) => {
				if (error) throw new Error("Cannot unsubscribe for dataservice event");
			}),
		);
	}

	//#endregion
	//#region Create Blasts and intialise
	/**
	 * @summary Create a new BlastModel using the BlastModel Builder.
	 * @param {$happn} $happn
	 * @param {number} createdAt
	 * @param {object} snapShot
	 * @returns {Promise}
	 * @todo Inject a unique blast ID which relates to the time and client
	 */
	async createNewBlast($happn, timeStamp) {
		const { blastService, blastRepository, dataService } = $happn.exchange;
		const { fsm } = $happn.config.env;
		const { log, emit } = $happn;

		try {
			if (this.currentBlast) {
				const msg = "Blast Creation error: Blast in progress - another fire button detected";
				await blastService.logEvent("blastService/STATE", createdAt, "Attempted Reblast");
				log.warn(msg);
				return false;
			}
			const snapShot = await dataService.getSnapShot();
			const firingDuration = modes[process.env.MODE].constraints.firingTime;
			const reportingDuration = modes[process.env.MODE].constraints.reportTime;
			this.currentBlast = BlastModel.create(timeStamp)
				.withId(uuid.v4())
				.withTimer("firing", firingDuration)
				.withTimer("reporting", reportingDuration)
				.withSnapshot(snapShot)
				.withFSM(fsm)
				.on("log", (msg) => log.info(msg))
				.on("state", (data) => blastService.handleState(data))
				.on("timer", (timer) => emit("timer", timer))
				.on("error", (err) => log.error(err))
				.start();
			const blastData = clone(this.currentBlast.blastReport);
			await blastRepository.upsertIndex(blastData);
			await blastRepository.set(blastData);
			await blastService.subscribeToBlastEvents();
			return true;
		} catch (err) {
			log.error("Cannot create new Blast Model", err);
		}
	}

	async getBlastModel($happn) {
		const { log } = $happn;

		if (this.currentBlast) {
			log.info(`Returning Blast report`);
			return clone(this.currentBlast.blastReport);
		}
		log.warn("No Blast Model to return");
	}
	/**
	 * @summary Subcribe to the eventService diff logs
	 * @param {$happn} $happn
	 * @returns {Promise} void
	 */
	async subscribeToBlastEvents($happn) {
		const { log } = $happn;
		const { eventService } = $happn.event;

		try {
			eventService.on(
				"UNIT_UPDATE",
				(data) => {
					if (this.currentBlast) this.currentBlast.addLog(data); //TODO need to remove if there is no model
				},
				(err, evRef) => {
					if (err) throw new Error("Error subscribing to eventService", err);
					this.eventRefLog = evRef;
				},
			);
		} catch (err) {
			log.error(err);
		}
	}
	//#endregion
	//#region BlastModel operational methods
	/**
	 * @summary Close off the Blast - works off this.currentBlast
	 * @param {$happn} $happn
	 * @returns {Promise}
	 */
	async closeBlast($happn, closeProc) {
		const { blastRepository, dataService } = $happn.exchange;
		const { eventService } = $happn.event;
		const { log } = $happn;

		try {
			if (!this.currentBlast) throw new Error("No current blast event to close");
			log.info(`Closing blast ${this.currentBlast.meta.id} with proc(${closeProc})`);
			this.currentBlast.removeAllListeners();
			const snapShot = await dataService.getSnapShot();
			this.currentBlast.setSnapshot(snapShot, "end");
			const blastData = clone(this.currentBlast.blastReport);
			await blastRepository.set(blastData);
			await blastRepository.upsertIndex(blastData);
			delete this.currentBlast;
			if (this.eventRefLog) {
				eventService.off(this.eventRefLog, (error) => {
					if (error) {
						throw new Error("Cannot unsubscribe from eventService event");
					}
				});
			}
		} catch (err) {
			log.error("Error closing Blast Event", err);
		}
	}

	async handleState($happn, data) {
		const { blastService } = $happn.exchange;
		const { log } = $happn;

		try {
			await blastService.logEvent("blastService/STATE", data.context.modified, data.state);
			if (data.state === "watching")
				log.info(`Blast Firing complete ${this.currentBlast.meta.id} - awaiting closure`);
			if (data.state === "closed") blastService.closeBlast(data.context.method);
		} catch (error) {
			log.error(error);
		}
	}
	/**
	 * @summary Sends an event to the event service
	 * @param {$happn} $happn
	 * @param {string} logType
	 * @param {number} createdAt
	 * @returns {Promise} void
	 */
	async logEvent($happn, logType, createdAt, msg) {
		const { emit, log } = $happn;

		try {
			const eventLog = EventLog.create(createdAt)
				.setLogType(logType)
				.setSerial(parseInt(this.currentBlast.meta.serial))
				.setTypeId(0)
				.withMessage(msg);
			emit("log", eventLog);
		} catch (error) {
			log.error(error);
		}
	}

	//#endregion

	//region UI utilities
	/**
	 * @summary Utility function to remove the Blast ID from
	 * the index and the Blast Object in the Blast Repo.
	 * @param {$happn} $happn
	 * @param {string} id The blast ID to be sent to the PDF utility
	 * @returns {promise}
	 */
	async deleteBlast($happn, id) {
		const { blastRepository } = $happn.exchange;
		const { log } = $happn;

		try {
			log.info(`Removing Blast Report - ${id}`);
			await blastRepository.delete(id);
			await blastRepository.deleteIndex(id);
			return true;
		} catch (err) {
			log.error("Error deleting blast Report", err);
		}
	}
	/**
	 * @summary Function to get a Blast JSON Object and send it to the PDF Utility.
	 * @param {$happn} $happn
	 * @param {string} id The blast ID to be sent to the PDF utility
	 * @returns {promise}
	 */
	async pdfBlast($happn, id) {
		const { blastRepository } = $happn.exchange;
		const { env } = $happn.config;
		const { log } = $happn;

		try {
			log.info(`Creating PDF of Blast Report - ${id}`);
			const blastReport = await blastRepository.get(id);
			delete blastReport._meta;
			const opts = {
				report: blastReport,
				theme: env.theme,
				template: env.template,
				filename: "emailReport",
			};
			const pdfFile = await $happn.exchange["mesh-pdf"].pdfService.createPDF(opts);
			if (pdfFile instanceof Error) throw new Error("Failed to create PDF");
			log.info(`PDF for Blast Id-${id} - successfully created`);
			return pdfFile;
		} catch (error) {
			log.error("Error creating PDF", error);
		}
	}
}

//#endregion

module.exports = BlastService;
