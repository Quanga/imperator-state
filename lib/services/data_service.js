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
	const { log } = $happn;
	const { emit } = $happn;

	return (async () => {
		try {
			log.info("Starting DataService...........");

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

			stateService.updateState({ service: $happn.name, state: "STARTED" });
		} catch (err) {
			log.error("Error in dataservice startup", err);
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
	const { log } = $happn;
	const { dataService } = $happn.exchange;

	return (async () => {
		log.info("stopping data service");
		await dataService.unlisten();
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
	const { log } = $happn;
	const { dataService } = $happn.exchange;

	return (async () => {
		try {
			log.info("Initialising DataService...........");

			await dataService.createDataModel();
			await dataService.createDataModelListeners();
		} catch (err) {
			log.error("Error initialising Data Service", err);
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
	const { nodeRepository, dataService } = $happn.exchange;
	const { log } = $happn;

	return (async () => {
		try {
			log.info("New DataModel Initialised.....");

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
		} catch (err) {
			log.error("Error creating datamodel", err);
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
			//this.dataModel.on("error", err => log.error(err));
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
					controlUnit = controlUnit.sort((a, b) => a.modified < b.modified);
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
	const { dataService } = $happn.exchange;
	const { log } = $happn;

	return (async () => {
		try {
			if (!Array.isArray(nodeArr)) throw new Error("variable NodeArray is not an Array");

			const checkClear = await dataService.preProcess(nodeArr);
			let updateRes;

			switch (checkClear.type) {
			case "DEFAULT":
				{
					updateRes = await dataService.updateState(nodeArr, false);
				}
				break;
			case "EDD_CLEARSIG":
				{
					await this.dataModel.resetChildCount(nodeArr[0], true);
					nodeArr[0].data.childCount = 0;
					updateRes = await dataService.updateState(nodeArr[0]);

					await dataService.clearEddSignal(nodeArr[0]);
				}
				break;
			case "FILTERED":
				{
					updateRes = await dataService.updateState(checkClear.value, false);
				}
				break;

			case "COMM_LOST":
				{
					updateRes = await dataService.updateState(nodeArr, false);
				}
				break;
			}

			if (updateRes.updates.length > 0) {
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
					resultObj.inserts.push(upsertResult);
					break;
				case "UPDATE":
					resultObj.updates.push(upsertResult);
					break;
				case "NONE":
					break;
				default:
					throw new Error("Unknown Update Action");
				}
			}

			if (resultObj.updates.length > 0) {
				log.info("DATA UPDATE - updating existing units", resultObj.updates.length);
				await this.__updateExistingNodes($happn, resultObj.updates);
			}

			if (resultObj.inserts.length > 0) {
				log.info("DATA UPDATE - inserting new units", resultObj.inserts.length);
				await this.__insertNewNodes($happn, resultObj.inserts);
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
	let result = [...nodeArr];
	const parentType = nodeArr[0].data.typeId;

	return (async () => {
		try {
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
				if (nodeArr.length === 1 && nodeArr[0].data.communicationStatus === 0) {
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

DataService.prototype.postProcess = function($happn, updatesArr) {
	const { emit, log } = $happn;

	return (async () => {
		const { data } = updatesArr[0].value;
		const { diff } = updatesArr[0];
		try {
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
							created: data.modified,
							snapShot: snapShot
						});

						let boosters = await this.dataModel.updateBoosterConnections(data.modified);

						if (boosters.length > 0) {
							for (let booster of boosters) {
								const result = await this.dataModel.upsertUnit(booster, true);
								const boosterArr = [result];
								await this.__updateExistingNodes($happn, boosterArr);
							}
						}
					}
				}
				break;
			case 3:
				{
					if (data.keySwitchStatus === 0 && diff && diff.keySwitchStatus === 0) {
						let dets = await this.dataModel.updateEDDConnections(data.serial, data.modified);
						if (dets.length > 0) {
							await this.__updateExistingNodes($happn, dets);
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

/***
 * @summary clears the dets
 * @param $happn
 * @param nodeArr - node array containing 1 cbb and 1 edd
 */
DataService.prototype.clearEddSignal = function($happn, parent) {
	const { nodeRepository } = $happn.exchange;
	const { emit, log } = $happn;

	return (async () => {
		try {
			const cutData = await nodeRepository.cutPath(parent.data.path);

			emit("EDDSIG", {
				serial: parent.data.serial,
				logType: "EDD_SIG",
				path: parent.data.path,
				typeId: parent.data.typeId,
				modified: parent.data.created
			});
			return true;
		} catch (err) {
			log.error(err);
		}
	})();
};

/**
 * @summary Handle the node inserts
 * @param $happn
 * @param inserts - data context which stores context.newnodes
 */
DataService.prototype.__insertNewNodes = function($happn, inserts) {
	const { error: logError } = $happn.log;
	const { nodeRepository } = $happn.exchange;

	return (async () => {
		for (const insert of inserts) {
			try {
				const nodeClone = { ...insert.value.data };

				await nodeRepository.insertNodeData(nodeClone);

				if (nodeClone.typeId !== 4) {
					this.emitQueue.push({
						id: nodeClone.parentSerial || 0,
						type: "UNIT_ADDED",
						value: [nodeClone]
					});
				}
			} catch (err) {
				logError(`Insert Node Error: ${JSON.stringify(insert, null, 2)}`);
				return Promise.reject(err);
			}
		}
	})();
};

/**
 * @summary Handle the node update from the CONTEXT.NEWNODES
 * @param {$happn} $happn
 * @param {units[]} updates - data context which stores context.newnodes
 */
DataService.prototype.__updateExistingNodes = function($happn, updates) {
	const { error: logError } = $happn.log;
	const { nodeRepository } = $happn.exchange;
	const { emit } = $happn;

	return (async () => {
		try {
			for (const update of updates) {
				const { data } = update.value;

				let changedObject = {
					serial: data.serial,
					logType: "change",
					typeId: data.typeId,
					path: data.path,
					parentSerial: data.parentSerial,
					modified: data.modified,
					changes: update.diff,
					counts: update.counts,
					windowId: data.typeId === 4 ? data.windowId : null
				};

				if (changedObject.changes) {
					emit("UNIT_UPDATED", changedObject);
				}

				nodeRepository.insertNodeData({ ...data });
			}
		} catch (err) {
			logError(`error updating`, err);
			return Promise.reject(err);
		}
	})();
};

/**
 * @summary Get the control unit
 * @param {$happn} $happn
 */
DataService.prototype.getControlUnit = function($happn) {
	const { error: logError } = $happn;

	return (async () => {
		try {
			const cu = clone(this.dataModel.controlUnit);
			delete cu.event;
			return cu;
		} catch (err) {
			logError("Error getting control unit", err);
		}
	})();
};

/**
 * @summary Get the booster units
 * @param {$happn} $happn
 * @param {boolean} withChildren Get the units with their children
 */
DataService.prototype.getUnits = function($happn, withChildren) {
	const { error: logError } = $happn;

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
			logError("Error getting units", err);
		}
	})();
};

DataService.prototype.getSnapShot = function($happn) {
	const { error: logError } = $happn;

	return (async () => {
		try {
			const snapShot = await this.dataModel.snapShot();
			return snapShot;
		} catch (err) {
			logError("Snapshot error", err);
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
