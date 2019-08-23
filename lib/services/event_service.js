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
	const { emit, log } = $happn;

	return (async () => {
		log.info("Started Event Service......");

		this.emitQueue = new Queue((task, cb) => {
			task.forEach(taskItem => {
				emit(taskItem.path, taskItem.value);
			});
			cb(task);
		});
	})();
};

EventService.prototype.stopAsync = function($happn) {
	const { log } = $happn;

	return (async () => {
		log.info("Event Service stopped");
	})();
};

/**
 * @summary Handles the emitting of the Data Service Events to other services
 * @param {$happn} $happn
 * @param {object} updates - eventObj
 */
EventService.prototype.handleEvent = function($happn, eventObj) {
	const { logsRepository } = $happn.exchange;
	const { emit, log } = $happn;

	const reduceLogs = payload => {
		let result = payload.reduce((acc, cur) => {
			if (!acc.hasOwnProperty(cur.data.typeId)) {
				acc[cur.data.typeId] = [];
			}

			acc[cur.data.typeId].push(cur);
			return acc;
		}, {});

		return { result, resultKeys: Object.keys(result) };
	};

	return (async () => {
		try {
			const { payload } = eventObj;
			let logResults;

			switch (eventObj.type) {
			case "EDD_SIG":
				logResults = {
					logType: "EDD_SIG",
					serial: payload.data.serial,
					typeId: payload.data.typeId,
					path: payload.data.path,
					modified: payload.data.created
				};
				break;

			case "INSERT":
				{
					const reducedLogs = reduceLogs(payload);
					logResults = reducedLogs.result;

					for (const logItem of reducedLogs.resultKeys) {
						let ob = {
							typeId: logResults[logItem][0].data.typeId,
							path: logResults[logItem][0].data.path,
							modified: logResults[logItem][0].data.created
						};

						switch (logItem) {
						case "4":
							ob.logType = "DET_INSERT";
							ob.serial = logResults[logItem][0].data.parentSerial;
							ob.changes = logResults[logItem].map(d => {
								return { serial: d.data.serial, windowId: d.data.windowId };
							});
							break;
						default:
							ob.logType = "UNIT_INSERT";
							ob.serial = logResults[logItem][0].data.serial;
							ob.changes = logResults[logItem].map(d => {
								return { serial: d.data.serial, windowId: d.data.windowId };
							});
							break;
						}
					}
				}
				break;
			case "UPDATE":
				{
					const reducedLogs = reduceLogs(payload);
					logResults = reducedLogs.result;

					for (const logItem of reducedLogs.resultKeys) {
						let ob = {
							logType: "UNIT_UPDATE",
							typeId: logResults[logItem][0].data.typeId,
							path: logResults[logItem][0].data.path,
							modified: logResults[logItem][0].data.modified
						};

						switch (logItem) {
						case "4":
							ob.logType = "DET_UPDATE";
							ob.serial = logResults[logItem][0].data.parentSerial;
							ob.changes = logResults[logItem].map(d => {
								return { serial: d.data.serial, windowId: d.data.windowId, diff: d.diff };
							});
							break;
						default:
							ob.serial = logResults[logItem][0].data.serial;
							ob.changes = logResults[logItem].map(d => {
								return { serial: d.data.serial, windowId: d.data.windowId, diff: d.diff };
							});
							break;
						}
					}
				}
				break;
			default:
				log.error("emitter was called with unknown TYPE");
			}

			await logsRepository.insertLog(logResults);

			// this.emitQueue.push({
			// 	path: "UPDATE_LOG",
			// 	value: [eventObj]
		} catch (err) {
			log.error(err);
		}
	})();
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

EventService.prototype.get = function($happn, from, to) {
	const { log } = $happn;
	const { logsRepository } = $happn.exchange;

	return (async () => {
		//const results =
	})();
};

module.exports = EventService;

/* 
  "type": "INSERT",
  "payload": {
    "updates": [],
    "inserts": [
      {
        "action": "INSERT",
        "value": {
          "data": {
            "serial": 2131501510,
            "typeId": 4,
            "parentType": 3,
            "created": 1565226440000,
            "modified": null,
            "path": "3/39/4/1",
            "parentSerial": 39,
            "detonatorStatus": 0,
            "bridgeWire": 0,
            "calibration": 0,
            "program": 0,
            "boosterFired": 0,
            "tagged": 0,
            "logged": 0,
            "delay": null,
            "windowId": 1
          },
          "dataType": "list"
        }
      },
      {
        "action": "INSERT",
        "value": {
          "data": {
            "serial": 2131599491,
            "typeId": 4,
            "parentType": 3,
            "created": 1565226440000,
            "modified": null,
            "path": "3/39/4/2",
            "parentSerial": 39,
            "detonatorStatus": 0,
            "bridgeWire": 0,
            "calibration": 0,
            "program": 0,
            "boosterFired": 0,
            "tagged": 0,
            "logged": 0,
            "delay": null,
            "windowId": 2
          },
          "dataType": "list"
        }
      },
      {
        "action": "INSERT",
        "value": {
          "data": {
            "serial": 2131760388,
            "typeId": 4,
            "parentType": 3,
            "created": 1565226440000,
            "modified": null,
            "path": "3/39/4/3",
            "parentSerial": 39,
            "detonatorStatus": 0,
            "bridgeWire": 0,
            "calibration": 0,
            "program": 0,
            "boosterFired": 0,
            "tagged": 0,
            "logged": 0,
            "delay": null,
            "windowId": 3
          },
          "dataType": "list"
        }
      },
      {
        "action": "INSERT",
        "value": {
          "data": {
            "serial": 2131387621,
            "typeId": 4,
            "parentType": 3,
            "created": 1565226440000,
            "modified": null,
            "path": "3/39/4/4",
            "parentSerial": 39,
            "detonatorStatus": 0,
            "bridgeWire": 0,
            "calibration": 0,
            "program": 0,
            "boosterFired": 0,
            "tagged": 0,
            "logged": 0,
            "delay": null,
            "windowId": 4
          },
          "dataType": "list"
        }
      },
      {
        "action": "INSERT",
        "value": {
          "data": {
            "serial": 2132329143,
            "typeId": 4,
            "parentType": 3,
            "created": 1565226440000,
            "modified": null,
            "path": "3/39/4/5",
            "parentSerial": 39,
            "detonatorStatus": 0,
            "bridgeWire": 0,
            "calibration": 0,
            "program": 0,
            "boosterFired": 0,
            "tagged": 0,
            "logged": 0,
            "delay": null,
            "windowId": 5
          },
          "dataType": "list"
        }
      },
      {
        "action": "INSERT",
        "value": {
          "data": {
            "serial": 2131467492,
            "typeId": 4,
            "parentType": 3,
            "created": 1565226440000,
            "modified": null,
            "path": "3/39/4/6",
            "parentSerial": 39,
            "detonatorStatus": 0,
            "bridgeWire": 0,
            "calibration": 0,
            "program": 0,
            "boosterFired": 0,
            "tagged": 0,
            "logged": 0,
            "delay": null,
            "windowId": 6
          },
          "dataType": "list"
        }
      },
      {
        "action": "INSERT",
        "value": {
          "data": {
            "serial": 2131517473,
            "typeId": 4,
            "parentType": 3,
            "created": 1565226440000,
            "modified": null,
            "path": "3/39/4/7",
            "parentSerial": 39,
            "detonatorStatus": 0,
            "bridgeWire": 0,
            "calibration": 0,
            "program": 0,
            "boosterFired": 0,
            "tagged": 0,
            "logged": 0,
            "delay": null,
            "windowId": 7
          },
          "dataType": "list"
        }
      },
      {
        "action": "INSERT",
        "value": {
          "data": {
            "serial": 2131492466,
            "typeId": 4,
            "parentType": 3,
            "created": 1565226440000,
            "modified": null,
            "path": "3/39/4/8",
            "parentSerial": 39,
            "detonatorStatus": 0,
            "bridgeWire": 0,
            "calibration": 0,
            "program": 0,
            "boosterFired": 0,
            "tagged": 0,
            "logged": 0,
            "delay": null,
            "windowId": 8
          },
          "dataType": "list"
        }
      },
      {
        "action": "INSERT",
        "value": {
          "data": {
            "serial": 2131242148,
            "typeId": 4,
            "parentType": 3,
            "created": 1565226440000,
            "modified": null,
            "path": "3/39/4/9",
            "parentSerial": 39,
            "detonatorStatus": 0,
            "bridgeWire": 0,
            "calibration": 0,
            "program": 0,
            "boosterFired": 0,
            "tagged": 0,
            "logged": 0,
            "delay": null,
            "windowId": 9
          },
          "dataType": "list"
        }
      },
      {
        "action": "INSERT",
        "value": {
          "data": {
            "serial": 2131433113,
            "typeId": 4,
            "parentType": 3,
            "created": 1565226440000,
            "modified": null,
            "path": "3/39/4/10",
            "parentSerial": 39,
            "detonatorStatus": 0,
            "bridgeWire": 0,
            "calibration": 0,
            "program": 0,
            "boosterFired": 0,
            "tagged": 0,
            "logged": 0,
            "delay": null,
            "windowId": 10
          },
          "dataType": "list"
        }
      },
      {
        "action": "INSERT",
        "value": {
          "data": {
            "serial": 2131210481,
            "typeId": 4,
            "parentType": 3,
            "created": 1565226440000,
            "modified": null,
            "path": "3/39/4/11",
            "parentSerial": 39,
            "detonatorStatus": 0,
            "bridgeWire": 0,
            "calibration": 0,
            "program": 0,
            "boosterFired": 0,
            "tagged": 0,
            "logged": 0,
            "delay": null,
            "windowId": 11
          },
          "dataType": "list"
        }
      },
      {
        "action": "INSERT",
        "value": {
          "data": {
            "serial": 2131412015,
            "typeId": 4,
            "parentType": 3,
            "created": 1565226440000,
            "modified": null,
            "path": "3/39/4/12",
            "parentSerial": 39,
            "detonatorStatus": 0,
            "bridgeWire": 0,
            "calibration": 0,
            "program": 0,
            "boosterFired": 0,
            "tagged": 0,
            "logged": 0,
            "delay": null,
            "windowId": 12
          },
          "dataType": "list"
        }
      }
    ]
  }
}
*/
