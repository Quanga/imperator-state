/* eslint-disable no-unused-vars */
var Queue = require("better-queue");
const PacketTemplate = require("../constants/packetTemplates");

function EventService() {
	this.__constants = new PacketTemplate();

	this.__logConstants = this.__constants.loggables;
	this.__warnConstants = this.__constants.warnables;

	this.dataModel = [];
	this.activeBlast = null;
	this.blastModels = [];
	this.eventRef = null;
}

EventService.prototype.startAsync = function($happn) {
	const { eventService } = $happn.exchange;
	const { dataService } = $happn.event;
	const { error: logError, info: logInfo } = $happn.log;
	const { emit } = $happn;

	const initAsync = async () => {
		logInfo("initialise Event Service .................. STARTED");
		this.emitQueue = new Queue(
			(task, cb) => {
				task.forEach(taskItem => {
					emit(taskItem.path, taskItem.value);
				});
				cb(task);
			},
			{
				merge: (oldTask, newTask, cb) => {
					oldTask.value = oldTask.value.concat(newTask.value);
					cb(null, oldTask);
				},
				batchSize: 10,
				batchDelay: 100,
				batchDelayTimeout: 1000
			}
		);

		dataService.on(
			"UNIT_UPDATED",
			async data => {
				await eventService.processLogs(data);
			},
			(err, eventRef) => {
				if (err) return logError("Cannot subscribe to the data service", err);

				this.eventRef = eventRef;
			}
		);
	};
	return initAsync();
};

EventService.prototype.stopAsync = function($happn) {
	const { error: logError, info: logInfo } = $happn.log;
	const { nodeRepository } = $happn.exchange;

	const initAsync = async () => {};

	return initAsync();
};

EventService.prototype.processLogs = function($happn, obj) {
	const { eventService } = $happn.exchange;

	let processAsync = async () => {
		const { logsRepository } = $happn.exchange;

		if (obj.typeId !== 4) {
			await logsRepository.insertLog(obj);

			this.emitQueue.push({
				id: "log",
				path: "UPDATE_LOG",
				value: [obj]
			});

			await eventService.processWarnings(obj);
		} else {
			this.emitQueue.push({
				id: "det",
				path: "UPDATE_DET",
				value: [obj]
			});
		}
	};

	return processAsync();
};

EventService.prototype.processWarnings = function($happn, changeEvents) {
	const { warningsRepository } = $happn.exchange;
	/**
	 * let changedObject = {
						serial: node.data.serial,
						typeId: node.data.typeId,
						modified: node.meta.storedPacketDate,
						changes: node.meta.dirty,
						number: this.emitCount
					};
	 */

	let processWarningsAsync = async () => {
		//will process here
		const { changes } = changeEvents;
		const changeKey = Object.keys(changes);
		//const warnings = this.__constants.getWarnables();

		//const loggableWarnings = changeKey.filter(x => x.indexOf(warnings) === -1);

		// 	for (let index = 0; index < filterOut.length; index++) {
		//   const element = filterOut[index];
		//   delete differences[element];
	};

	//3. compare which warnings need to be logged
	//4. send them to the warnings repository
	//5. emit an event for the ui to get the warnings

	//return processWarningsAsync();
};

module.exports = EventService;
