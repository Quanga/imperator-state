/* eslint-disable no-unused-vars */
/**
 * @category Data Service
 * @module lib/services/dataService
 * @requires PacketTemplate
 * @requires module:lib/models/dataModel
 * @requires module:DataMapper
 * @requires clone
 * @requires pdfUtils
 * @requires better-queue
 */
const PacketTemplate = require("../constants/packetTemplates");
const Queue = require("better-queue");
const DataModel = require("../models/dataModel");
const DataMapper = require("../mappers/data_mapper");
const clone = require("clone");

/**
 * @category Data Service
 * @class DataService
 * @prop {DataModel} this.dataModel The Core State DataModel
 * @prop {object} this.__constants Constants
 * @prop {DataMapper} this.dataMapper The Diff mapper
 * @prop {array} this._eventRefs List of event refs required for removal on stop
 */
function DataService() {
	this.dataModel = null;
	this.__constants = new PacketTemplate();
	this.dataMapper = new DataMapper();
	this._eventRefs = [];
}

/**
 * <ul>
 * <li>Start the component when Happner starts.</li>
 * <li>Creates a new DataModel and Emit Queue.</li>
 * <li>Starts the listners for the Data Model</li></ul><br>
 * @param {$happn} $happn Dependancy Injection of the Happner Framework
 * @returns {Promise}
 */
DataService.prototype.componentStart = function($happn) {
	const { stateService } = $happn.exchange;
	const { name, emit } = $happn;

	return (async () => {
		try {
			this.emitQueue = new Queue(
				(task, cb) => {
					task.forEach(taskItem => {
						emit(taskItem.path, taskItem.value);
					});
					cb();
				}
				// {
				// 	merge: (oldTask, newTask, cb) => {
				// 		oldTask.value = oldTask.value.concat(newTask.value);
				// 		cb(null, oldTask);
				// 	},
				// 	batchSize: 10,
				// 	batchDelay: 100,
				// 	batchDelayTimeout: 1000
				// }
			);

			stateService.updateState({ service: name, state: "INITIALIZED" });
		} catch (err) {
			stateService.updateState({ service: name, state: "FAILED" });
		}
	})();
};

/**
 * <ul>
 * <li>Stops the component when Happner stops.</li>
 * <li>Stops the listners.</li>
 * <li>Starts the listners for the Data Model</li></ul><br>
 * @param {$happn} $happn Dependancy Injection of the Happner Framework
 * @returns {Promise} void
 */
DataService.prototype.componentStop = function($happn) {
	const { stateService, dataService } = $happn.exchange;
	const { name } = $happn;

	return (async () => {
		await dataService.unlisten();
		stateService.updateState({ service: name, state: "STARTED" });
	})();
};

/**
 * <ul>
 * <li>Called by {@link module:app~App#startRouter}.</li>
 * <li>Starts the listners for the Data Model</li></ul><br>
 * @param {$happn} $happn Dependancy Injection of the Happner Framework
 * @returns {Promise}
 */
DataService.prototype.initialise = function($happn) {
	const { dataService, stateService } = $happn.exchange;
	const { name } = $happn;

	return (async () => {
		try {
			await dataService.createDataModel();
			await dataService.createDataModelListeners();
		} catch (error) {
			stateService.updateState({ service: name, state: "FAILED", error });
		}
	})();
};

/**
 * <ul><li>Create and populate the DataModel on startup of this Service.</li>
 * <li>Gets the persisted units from the datastore</li>
 * @param {$happn} $happn Dependancy Injection of the Happner Framework
 * @returns {Promise}
 * @mermaid graph LR
 * A[New DataModel]-->B[createListeners]
 * B-.->C[getAllPersisted]
 * C-->D[validateUnits]
 * D-->|populate units|A
 */
DataService.prototype.createDataModel = function($happn) {
	const { nodeRepository, dataService, stateService } = $happn.exchange;
	const { log, name } = $happn;

	return (async () => {
		try {
			this.dataModel = new DataModel();
			const units = await nodeRepository.getAllNodes();

			const validatedUnits = await dataService.validatePersisted(units);

			if (validatedUnits) {
				for (const unit of validatedUnits) {
					await this.dataModel.upsertUnit(unit);
				}
			} else {
				log.warn("No Units found in Node Repository.... DataModel is empty");
			}
		} catch (error) {
			log.error(error);
		}
	})();
};

/**
 * <ul><li>Starts the listners for the Data Model.</li>
 * <li>Broker the events from the DataModel to the rest of the system.</li></ul><br>
 * @param {$happn} $happn Dependancy Injection of the Happner Framework
 * @returns {Promise} void
 * @listens DataModel#UNITCOUNT - Brokers emits and hands to Happn Emit
 * @listens DataModel#UNIT_COMMS_LOST - Handles the timer for Comms lost on timed units
 * @listens DataModel#error Handles the error logging inside the data model to the Happn Logger
 * @fires module:lib/services/dataService~DataService#UNITCOUNT
 */
DataService.prototype.createDataModelListeners = function($happn) {
	const { dataService } = $happn.exchange;
	const { log, emit } = $happn;

	return (async () => {
		try {
			this.dataModel.on("UNITCOUNT", val => emit("UNITCOUNT", val));
			this.dataModel.on("UNIT_COMMS_LOST", val => dataService.upsertNodeDataArr(val));
			this.dataModel.on("error", err => log.error(err));
		} catch (err) {
			log.error(err);
		}
	})();
};

/**
 * <ul><li>Removes the listners from the Data Model.</li></ul>
 * @param {$happn} $happn Dependancy Injection of the Happner Framework
 * @returns {Promise}
 */
DataService.prototype.unlisten = function($happn) {
	const { log } = $happn;
	const dataModelEvents = ["UNITCOUNT", "UNIT_COMMS_LOST", "error"];

	return (async () => {
		try {
			if (!this.dataModel) throw new Error("No DataModel");
			for (const ev of dataModelEvents) {
				this.dataModel.removeAllListeners(ev);
			}
		} catch (err) {
			log.error("Error removing listeners..", err.message);
		}
	})();
};

/**
 * <ul><li>Validate the persisted Units and return to the create method</li></ul>
 * @param {$happn} $happn Dependancy Injection of the Happner Framework
 * @returns {(Promise<units[]> | Promise<null>)} result Array or null
 */
DataService.prototype.validatePersisted = function($happn, units) {
	const { log } = $happn;

	return (async () => {
		try {
			let resultArr = [];

			let controlUnit = await units.filter(u => u.typeId === 0);

			if (controlUnit && controlUnit.length > 0) {
				if (controlUnit.length > 1) {
					const allCu = controlUnit.reduce((acc, cur) => acc.concat(`-${cur.path}  `), "");
					controlUnit = controlUnit.sort((a, b) => a.modifiedAt < b.modifiedAt);
					log.warn(`Too Many control units found.... please remove one of ${allCu}`);
					log.warn(`Adding latest to Blast Model - unit ${controlUnit[0].path}`);
				}

				resultArr.push(controlUnit[0]);
				log.info(`Adding Control Unit ${controlUnit[0].serial}`);
			} else {
				log.warn("No Control Unit found...");
			}

			let boosters = units.filter(u => u.typeId === 3);
			if (boosters && boosters.length > 0) {
				log.info(`Adding ${boosters.length} boosters to the Data Model`);
				for (let booster of boosters) {
					log.info(`Adding ${booster.serial} to the Data Model`);
					resultArr.push(booster);
				}
			} else {
				log.info("No Boosters found in the Data Store.");
			}

			let dets = units.filter(u => u.typeId === 4);
			if (dets && dets.length > 0) {
				log.info(`Adding ${dets.length} detonators to the Data Model`);
				for (let det of dets) {
					resultArr.push(det);
				}
			} else {
				log.info("No Detonators found in the Data Store.");
			}

			if (resultArr.length > 0) {
				const remappedUnits = await this.dataMapper.mapToUnits(resultArr);
				return remappedUnits;
			}
			return null;
		} catch (err) {
			log.error("Error validating the persisted data ", err);
		}
	})();
};

/**
 * <ul><li>Clears the DataModel by creating a new DataModel instance.</li>
 * <li>Utiliity method for now</li></ul>
 * @param {$happn} $happn Dependancy Injection of the Happner Framework
 * @returns {Promise}
 */
DataService.prototype.clearDataModel = function($happn) {
	return new Promise((resolve, reject) => {
		this.dataModel = new DataModel();
		resolve();
	});
};

/**
 * <ul><li>Primary Pathway for the Node Array</li>
 * <li>Handles upserting and flow</li></ul><br>
 * @param {$happn} $happn Dependancy Injection of the Happner Framework
 * @param {object[]} nodeArr The incoming node array
 * @returns {Promise}
 * @mermaid graph LR
 				A[nodeArr]-.->|from queue|B[upsertNodeDataArr]
 				B-->|check conditions|C{PreProcess}
 				C-->|EDD_CLEARSIG|resetChildCount
 				resetChildCount-->|EDD_CLEARSIG|updateState
 				C-->|FILTERED|updateState
 				C-->|CLEAR|updateState
 				C-->|COMM_LOST|updateState
 				updateState-->postProcess
 */
DataService.prototype.upsertNodeDataArr = function($happn, nodeArr) {
	const { dataService, nodeRepository, eventService } = $happn.exchange;
	const { log } = $happn;

	return (async () => {
		try {
			if (!Array.isArray(nodeArr)) throw new Error("variable NodeArray is not an Array");

			let updateRes;
			const preProcess = await dataService.preProcess(nodeArr);

			switch (preProcess.type) {
			case "DEFAULT":
				updateRes = await dataService.updateState(nodeArr, false);
				break;

			case "EDD_CLEARSIG":
				await this.dataModel.resetChildCount(nodeArr[0]);
				nodeArr[0].data.childCount = 0;
				updateRes = await dataService.updateState(nodeArr[0]);
				if (!nodeArr[0].data.path) {
					nodeArr[0].setPath();
				}
				await nodeRepository.cutPath(nodeArr[0].data.path);
				await eventService.handleEvent({
					type: "EDD_SIG",
					serial: nodeArr[0].data.serial,
					createdAt: nodeArr[0].data.modifiedAt || nodeArr[0].data.createdAt,
					typeId: nodeArr[0].data.typeId
				});
				break;

			case "FILTERED":
				updateRes = await dataService.updateState(preProcess.value, false);
				break;

			case "COMM_LOST":
				updateRes = await dataService.updateState(nodeArr, false);
				break;
			default:
				throw new Error("Process Type must be suppled");
			}

			if (updateRes && updateRes.updates.length > 0) {
				await dataService.postProcess(updateRes.updates);
			}
		} catch (err) {
			log.error("Process Upsert error.............", err);
			return Promise.reject(err);
		}
	})();
};

/**
 * <ul><li>Update the state of the checked Array</li>
 * <li>.....</li></ul><br>
 * @param {$happn} $happn Dependancy Injection of the Happner Framework
 * @param {object[]} nodeArr The incoming node array
 * @param {boolean} force force update flag
 * @returns {Promise}
 * @mermaid sequenceDiagram
 				updateState->>dataModel: upsertUnit
 				dataModel->>updateState: return action
 				Note left of updateState: INSERT, UPDATE or NONE
 				updateState->>__updateExistingNodes: update
 				updateState->>__insertNewNodes: insert
 */
DataService.prototype.updateState = function($happn, nodeArr, force) {
	const { dataService, eventService } = $happn.exchange;
	const { log } = $happn;

	return (async () => {
		try {
			let arr = nodeArr;
			if (!Array.isArray(nodeArr)) arr = [nodeArr];

			let resultObj = { updates: [], inserts: [] };

			for (const unit of arr) {
				let upsertResult = await this.dataModel.upsertUnit(unit, force);
				if (!upsertResult || !upsertResult.action) {
					throw new Error("Return from dataModel is not in correct format");
				}

				switch (upsertResult.action) {
				case "INSERT":
					resultObj.inserts.push(upsertResult.value);
					break;
				case "UPDATE":
					resultObj.updates.push(upsertResult.value);
					break;
				case "NONE":
					break;
				default:
					throw new Error("Unknown Update Action");
				}
			}

			if (resultObj.inserts.length > 0) {
				log.info("DATA UPDATE - inserting new units", resultObj.inserts.length);

				await dataService.persistUnits(resultObj.inserts);
				await eventService.handleEvent({
					type: "INSERT",
					serial: arr[0].data.serial,
					createdAt: arr[0].data.createdAt,
					typeId: arr[0].data.typeId,
					payload: resultObj.inserts
				});
			}

			if (resultObj.updates.length > 0) {
				log.info("DATA UPDATE - updating existing units", resultObj.updates.length);

				await dataService.persistUnits(resultObj.updates);
				await eventService.handleEvent({
					type: "UPDATE",
					serial: arr[0].data.serial,
					createdAt: arr[0].data.modifiedAt || arr[0].data.createdAt,
					typeId: arr[0].data.typeId,
					payload: resultObj.updates
				});
			}

			return resultObj;
		} catch (err) {
			log.error("Error updating the state", err);
		}
	})();
};

/**
 * <ul>
 * <li>Preprocess the nodeArray to see if any action is required before updating</li>
 * <li>.....</li></ul><br>
 * @param {$happn} $happn Dependancy Injection of the Happner Framework
 * @param {object[]} nodeArr The incoming node array
 * @returns {Promise<action>} Action
 
 * @mermaid sequenceDiagram
 * updateState->>dataModel: upsertUnit
 * dataModel->>updateState: return action
 * Note left of updateState: INSERT or UPDATE
 * updateState->>__updateExistingNodes: update
 * updateState->>__insertNewNodes: insert
 */
DataService.prototype.preProcess = function($happn, nodeArr) {
	const { log } = $happn;

	return (async () => {
		try {
			let result = [...nodeArr];
			const parentType = nodeArr[0].data.typeId;

			if (parentType === 3) {
				//clear EDDs when typeId is 4, and UID is 255.255.255.255
				if (nodeArr[0].dataType === "list" && nodeArr.length === 2) {
					if (nodeArr[1].data.typeId === 4 && nodeArr[1].data.serial === 4294967295) {
						log.info(`EDD_SIG for ${nodeArr[0].data.serial} received`);
						return { type: "EDD_CLEARSIG" };
					}
				}

				if (nodeArr[0].dataType === "data") {
					//edge case where strange edd comes in after eddsig in an 05 command
					if (
						result.length === 2 &&
						result[1].data.delay === 255 &&
						result[1].data.windowId === 255
					) {
						result = result.slice(0, 1);
					}

					//edge case - turn off edds if the cbb goes from on to off
					//////////////const checkedArr = await dataService.checkCBBKeyOff(result);
					//if (checkedArr) return { type: "DETS_OFF", value: checkedArr };

					return { type: "FILTERED", value: result };
				}
				if (
					nodeArr[0].dataType !== "list" &&
					nodeArr.length === 1 &&
					nodeArr[0].data.communicationStatus === 0
				) {
					log.info(`Communication lost for unit - ${nodeArr[0].data.serial}`);
					return { type: "COMM_LOST" };
				}
			}
			return { type: "DEFAULT" };
		} catch (err) {
			log.error("Proprocessing error", err);
		}
	})();
};

/**
 * <ul>
 * <li>Post Process Actions to update certain states</li>
 * <li>.....</li></ul><br>
 * @param {$happn} $happn Dependancy Injection of the Happner Framework
 * @param {object[]} updatesArr The incoming node array
 * @returns {Promise<action>} Action
 */
DataService.prototype.postProcess = function($happn, updatesArr) {
	const { dataService } = $happn.exchange;
	const { emit, log } = $happn;

	return (async () => {
		try {
			const { data, dataType } = updatesArr[0];
			const { diff } = updatesArr[0];

			switch (data.typeId) {
			case 0:
				{
					if (
						data.keySwitchStatus === 1 &&
							data.fireButton === 1 &&
							diff &&
							diff.fireButton === 1
					) {
						const snapShot = await this.dataModel.snapShot();
						emit("BLAST_STARTED", {
							createdAt: data.modifiedAt,
							snapShot: snapShot
						});

						let boosters = await this.dataModel.updateBoosterConnections(data.modifiedAt);

						if (boosters.length > 0) {
							for (let booster of boosters) {
								const result = await this.dataModel.upsertUnit(booster, true);
								const boosterArr = [result];
								await dataService.persistUnits(boosterArr);
							}
						}
					}
				}
				break;
			case 3:
				{
					if (
						dataType === "data" &&
							data.keySwitchStatus === 0 &&
							diff &&
							diff.keySwitchStatus === 0
					) {
						log.info(`Turning off Detonators for unit ${data.serial}`);
						const childDets = await this.dataModel.updateEDDConnections(
							data.serial,
							data.modifiedAt
						);
						if (childDets.length > 0) {
							await dataService.persistUnits(childDets);
						}
					}
				}

				break;
			default: {
				return null;
			}
			}
		} catch (err) {
			log.error("Postprocessing err", err);
		}
	})();
};

/**
 * @summary Handle the node update from the CONTEXT.NEWNODES
 * @param {$happn} $happn
 * @param {units[]} updates - data context which stores context.newnodes
 */
DataService.prototype.persistUnits = function($happn, updates) {
	const { nodeRepository } = $happn.exchange;
	const { log } = $happn;

	//console.log(updates);

	return (async () => {
		try {
			for (let update of updates) {
				nodeRepository.insertNodeData({ ...update.data });
			}
		} catch (err) {
			log.error(`error updating`, err);
		}
	})();
};

/**
 * @summary Get the control unit
 * @param {$happn} $happn
 */
DataService.prototype.getControlUnit = function($happn) {
	const { log } = $happn;

	return (async () => {
		try {
			const cu = clone(this.dataModel.controlUnit);
			delete cu.event;
			return cu;
		} catch (err) {
			log.error("Error getting control unit", err);
		}
	})();
};

/**
 * @summary Get the booster units
 * @param {$happn} $happn
 * @param {boolean} withChildren Get the units with their children
 */
DataService.prototype.getUnits = function($happn, withChildren) {
	const { log } = $happn;

	return (async () => {
		try {
			let result = clone(this.dataModel.units);
			let unitKeys = Object.keys(result);

			if (!withChildren) {
				for (let i = 0; i < unitKeys.length; i++) {
					await delete result[unitKeys[i]].event;
					await delete result[unitKeys[i]].meta;
					await delete result[unitKeys[i]].children;
				}
			}
			return result;
		} catch (err) {
			log.error("Error getting units", err);
		}
	})();
};

DataService.prototype.getSnapShot = function($happn) {
	const { log } = $happn;

	return (async () => {
		try {
			const snapShot = await this.dataModel.snapShot();
			return snapShot;
		} catch (err) {
			log.error("Snapshot error", err);
		}
	})();
};

/**
 * @category Data Service
 * @event module:lib/services/dataService~DataService#UNITCOUNT
 * @type {object}
 * @prop {object} Value to deine
 * @todo Document this object correctly
 */

/**
 * @category Data Service
 * @event EDDSIG
 * @summary Fires the Clear signal for a booster
 * @type {object}
 * @prop {string} parent.data.path the path of the unit the EDDSIG is from
 * @memberof module:lib/services/dataService~DataService
 */

/**
 * @typedef {object} action
 * @prop {string} action.type Type of action
 * @prop {object} action.value Value of action
 * @example { type: "FILTERED", value: result }
 * @memberof module:lib/services/dataService~DataService
 *
 */

module.exports = DataService;
