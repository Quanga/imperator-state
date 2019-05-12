/* eslint-disable no-unused-vars */
/* eslint-disable no-mixed-spaces-and-tabs */
function EventService() {
	const PacketTemplate = require("../constants/packetTemplates");
	this.__constants = new PacketTemplate();

	this.__logConstants = this.__constants.loggables;
	this.__warnConstants = this.__constants.warnables;

	this.dataModel = [];
	this.activeBlast = null;
	this.blastModels = [];
}

EventService.prototype.startAsync = function($happn) {
	const { eventService, nodeRepository } = $happn.exchange;
	const { error: logError, info: logInfo } = $happn.log;

	let initAsync = async () => {
		logInfo("initialise Event Service .................. STARTED");
		//this.dataModel = await nodeRepository.getAllNodes();
		const _this = this;

		$happn.event.dataService.on(
			"nodes/updated",
			async function(data, meta) {
				await eventService.processLogs(data);
			},
			function(err, _eventRef) {
				if (err) {
					logError("initialize Event Service.................... FAIL", err);
					return Promise.reject(err);
				}
			}
		);
	};
	return initAsync();
};

EventService.prototype.stopAsync = function($happn) {
	const { error: logError, info: logInfo } = $happn.log;

	let initAsync = async () => {
		$happn.event.nodeRepository.offPath("nodes/updated", function(
			err,
			_eventRef
		) {
			if (err) {
				logError("Event Service ShutDown.................... FAIL", err);
				return Promise.reject(err);
			}

			logInfo("EventService ShutDown Complete");
		});
	};
	return initAsync();
};

EventService.prototype.getModelStructureFlat = function($happn) {
	const { error: logError } = $happn.log;

	const getModelAsync = async () => {
		try {
			let result = [];
			this.dataModel.forEach(item => {
				result.push(item);
				if (item.data.typeId === 3 || item.data.typeId === 1) {
					result = result.concat(item.childUnits);
				}
			});
			return result;
		} catch (err) {
			logError("error getting model");
			return Promise.reject(err);
		}
	};

	return getModelAsync();
};

EventService.prototype.getModelStructure = function($happn) {
	const { error: logError } = $happn.log;

	const getModelAsync = async () => {
		try {
			return this.dataModel;
		} catch (err) {
			logError("error getting model");
			return Promise.reject(err);
		}
	};

	return getModelAsync();
};

EventService.prototype.getBlastModel = function($happn) {
	const { error: logError } = $happn.log;

	const getModelAsync = async () => {
		try {
			return this.activeBlast;
		} catch (err) {
			logError("error getting model");
			return Promise.reject(err);
		}
	};

	return getModelAsync();
};

EventService.prototype.getAllBlastModels = function($happn) {
	const { error: logError } = $happn.log;

	const getModelAsync = async () => {
		try {
			return this.blastModels;
		} catch (err) {
			logError("error getting model");
			return Promise.reject(err);
		}
	};

	return getModelAsync();
};

EventService.prototype.addNode = function($happn, node) {
	const { error: logError } = $happn.log;

	const addModelAsync = async () => {
		try {
			if (node.data.typeId === 0) {
				this.activeBlast.addToBlast(node);
			}

			if (node.data.typeId === 4 || node.data.typeId === 2) {
				let parent = this.dataModel.find(
					x => x.data.id === node.data.parent_id
				);
				parent.childUnits.push(node);
			} else {
				this.dataModel.push(node);
			}
			return this.dataModel;
		} catch (err) {
			logError("error getting model");
			return Promise.reject(err);
		}
	};

	return addModelAsync();
};

EventService.prototype.updateNode = function($happn, node) {
	const { error: logError } = $happn.log;
	const { data } = node;

	const updateNodeAsync = async () => {
		try {
			let nodeToUpdate;
			//find the node
			if (data.typeId === 2 || data.typeId === 4) {
				//
				let nodeParent = this.dataModel.find(
					x => x.data.id === node.data.parent_id
				);

				if (nodeParent) {
					nodeToUpdate = nodeParent.childUnits.find(
						dataNode =>
							dataNode.data.serial === node.data.serial &&
							dataNode.data.typeId === node.data.typeId
					);
				}
			} else {
				nodeToUpdate = this.dataModel.find(
					dataNode =>
						dataNode.data.serial === node.data.serial &&
						dataNode.data.typeId === node.data.typeId
				);
			}

			if (nodeToUpdate != undefined) {
				nodeToUpdate = node;
			}

			return this.dataModel;
		} catch (err) {
			logError("error getting model");
			return Promise.reject(err);
		}
	};
	return updateNodeAsync();
};

EventService.prototype.handleFireButton = function($happn, nodeArr, context) {
	const { error: logError } = $happn.log;
	const { allNodes } = context;
	const parent = nodeArr[0];

	let handleFireAsync = async () => {
		try {
			if (parent.data.typeId === 0 && parent.data.fire_button === 1) {
				allNodes.forEach(nodeObj => {
					if (nodeObj.data.typeId === 2) {
						nodeObj.data.booster_fired_lfs = 0;
						nodeObj.data.detonator_lfs =
							nodeObj.data.detonator_status === 0
								? "No detonator"
								: "Not fired";
					}
				});
			}
		} catch (err) {
			logError("error executing handle Fire Button", err);
			return Promise.reject(err);
		}
	};

	return handleFireAsync();
};

EventService.prototype.processLogs = function($happn, obj) {
	const { eventService } = $happn.exchange;
	const { emit } = $happn;

	let processAsync = async () => {
		const { logsRepository } = $happn.exchange;
		await logsRepository.insertLog(obj);
		console.log("EMITTING", obj);
		emit("log", obj);

		await eventService.processWarnings(obj);
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

	return processWarningsAsync();
};

// EventService.prototype.processLogs = function($happn, context) {
// 	const { error: logError } = $happn.log;
// 	const { logsRepository, warningsRepository } = $happn.exchange;

// 	let newLogs = [];
// 	let newWarnings = [];

// 	let mapProps = async (newNodeFull, ables, returnList, condition) => {
// 		const { data: newNode } = newNodeFull;

// 		try {
// 			for (const key in newNode) {
// 				if (ables[key] !== undefined) {
// 					let propResult = newNode[key];
// 					if (propResult != null) {
// 						if (newNode[key] != null) {
// 							let message;
// 							if (ables[key][newNode.typeId]) {
// 								if (condition !== undefined) {
// 									if (!condition || condition === propResult) {
// 										message = ables[key][newNode.typeId][propResult];
// 									}
// 								} else {
// 									message = ables[key][newNode.typeId][propResult];
// 								}
// 							} else {
// 								if (condition !== undefined) {
// 									if (condition === propResult) {
// 										message = ables[key]["default"][propResult];
// 									}
// 								} else {
// 									message = ables[key]["default"][propResult];
// 								}
// 							}
// 							if (message) {
// 								let answer = message(newNode.serial, newNode.typeId);

// 								let timestamp;
// 								if (newNodeFull.meta.storedPacketDate) {
// 									timestamp = new Date(newNodeFull.meta.storedPacketDate)
// 										.toISOString()
// 										.slice(0, 19)
// 										.replace("T", " ");
// 								} else {
// 									timestamp = newNode.created;
// 								}

// 								let res = {
// 									serial: newNode.serial,
// 									typeId: newNode.typeId,
// 									key: key,
// 									value: propResult,
// 									message: answer,
// 									created: timestamp
// 								};
// 								returnList.push(res);
// 							}
// 						}
// 					}
// 				}
// 			}
// 		} catch (err) {
// 			logError(`mapping error ${newNode} -- ${err}`);
// 		}
// 	};

// 	let Process = async () => {
// 		//1.  take the context and create logs and warnings for New nodes
// 		for (const newNode of context.newNodes) {
// 			await mapProps(newNode, this.__logConstants, newLogs);
// 			await mapProps(newNode, this.__warnConstants, newWarnings, 1);
// 		}

// 		//2. take the context and create logs and warnings for updated nodes
// 		for (const updatedNode of context.updateNodes) {
// 			if (updatedNode.meta.dirty && updatedNode.meta.dirty.length > 0) {
// 				let dirtyObj = {
// 					modified: updatedNode.data.modified,
// 					events: []
// 				};

// 				dirtyObj.events = updatedNode.meta.dirty.reduce((accum, [k, v]) => {
// 					accum[k] = v["incoming"];
// 					return accum;
// 				}, {});

// 				//send the events to process the blast event
// 				await mapProps(updatedNode, this.__logConstants, newLogs);
// 				await mapProps(updatedNode, this.__warnConstants, newWarnings, 1);

// 				if (updatedNode.meta.dirty) {
// 					updatedNode.state.events.push(dirtyObj);
// 					await this.processEvents($happn, updatedNode);

// 					delete updatedNode.meta.dirty;
// 				}
// 			}
// 		}

// 		if (newLogs.length > 0) {
// 			this.persist($happn, newLogs, logsRepository);
// 			this.emitChange($happn, context);
// 		}

// 		if (newWarnings.length > 0) {
// 			this.persist($happn, newWarnings, warningsRepository);
// 			this.emitChange($happn, context);
// 		}
// 	};
// 	return Process();
// };

EventService.prototype.persist = function($happn, Arr, repository) {
	const { error: logError } = $happn.log;
	try {
		Arr.forEach(log => {
			repository.insert(log);
		});
	} catch (err) {
		logError("persist logs/warnings error", err);
	}
};

EventService.prototype.emitChange = function($happn, context) {
	const emitChanges = async () => {
		var eventKey = "data/";
		var eventData = context.updateNodes;

		$happn.log.info(`emitting ${eventKey}: ${eventData}`);
		$happn.emit(eventKey, eventData);
	};
	return emitChanges();
};

// /*************************************************************
//  * CHECK FUNCTIONS
//  **************************************************************
//  */
EventService.prototype.checkEddClearSignal = function($happn, nodeArr) {
	const { nodeRepository } = $happn.exchange;
	const { info: logInfo, error: logError } = $happn.log;

	const checkForEddClear = async () => {
		try {
			//logInfo("CHECK FOR EDD CLEAR");
			if (nodeArr) {
				let clearSignal = nodeArr.find(
					//clear EDDs when typeId is 4, and UID is 255.255.255.255
					node => node.data.typeId === 4 && node.data.serial === 4294967295
				);

				if (clearSignal) {
					logInfo("running clear signal");
					let parentInfo = await nodeRepository.getNode(
						clearSignal.data.parent_serial,
						clearSignal.data.parent_type
					);

					await nodeRepository.archiveEdds(parentInfo[0]);
					//need to remove all the edds from the list by removing
					//WHERE typeId = 4 AND parent_id = ${cbb.id}
					let cbbParent = this.dataModel.find(
						x => x.data.id == parentInfo[0].data.id
					);

					//need to trigger the clear on the blastmodel as well
					//TODO
					//await this.activeBlast.snapShotEdds(cbbParent, "end");
					cbbParent.childUnits = [];

					let index = nodeArr.indexOf(clearSignal);
					nodeArr.splice(index, 1);
				}
			}
		} catch (err) {
			logError(`check for edd clear error`);
			return Promise.reject(err);
		}
	};

	return checkForEddClear();
};

EventService.prototype.createLogResultObject = function() {
	return {
		node_serial: null,
		message: null
	};
};

// /*************************************************************
//  * BLAST EVENT FUNCTIONS
//  **************************************************************
//  */
EventService.prototype.createBlastEvent = function($happn) {
	const { error: logError, info: logInfo } = $happn.log;

	const { config } = $happn;
	const BlastModel = require("../models/blastModel");
	//****************************************************************** */
	//get the control unit and add it to the blast model
	//this is a simple start - will be fleshed out as we go
	//****************************************************************** */
	let newBlastEvent = this.blastModels.push(new BlastModel(new Date()));
	this.activeBlast = this.blastModels[newBlastEvent - 1];
	logInfo("New Blast Event Created - id: ", this.activeBlast.blastId);

	let controlUnit = this.dataModel.find(node => node.data.typeId === 0);
	if (controlUnit) {
		this.activeBlast.addToBlast(controlUnit);
	} else {
		logError("NO CONTROL UNIT FOUND IN DATA");
	}
	//look through the data for next units that meet the requirement to be
	//added to the blast event
	//AXXIS
	//this would be units that are armed or units that have detonators attached
	if (config.systemType === "AXXIS") {
		//check each cbb for armed, or if it has any edds attached
		for (const unit of this.dataModel) {
			if (
				unit.data.key_switch_status === 1 &&
				unit.data.typeId === 3 &&
				unit.state.blastEventState === "INACTIVE"
			) {
				this.activeBlast.addToBlast(unit);
			}
		}
	}

	//IBS
	//this would be all ISCs and only 651s which are armed or have a detonator
	//attached
	if (config.systemType === "IBS") {
		//check each 651 for armed, or if it has any dets attached
		for (const unit of this.dataModel) {
			if (unit.data.typeId === 1) {
				this.activeBlast.addToBlast(unit);
			}
			if (
				unit.data.typeId === 2 &&
				unit.data.key_switch_status === 1 &&
				unit.state.blastEventState === "INACTIVE"
			) {
				this.activeBlast.addToBlast(unit);
			}
		}
	}
};

EventService.prototype.processEvents = function($happn, node) {
	//take the node  and process the events and make shit happn
	const { error: logError } = $happn.log;

	let processAsync = async () => {
		try {
			//get the last event
			let nodeEvents = node.state.events[node.state.events.length - 1];

			if (node.data.typeId === 0) {
				if (nodeEvents.events["key_switch_status"] === 1) {
					this.activeBlast.systemState.armedState = "ARMED";
				}

				if (nodeEvents.events.hasOwnProperty("key_switch_status")) {
					if (nodeEvents.events["key_switch_status"] === 0) {
						this.activeBlast.systemState.armedState = "DISARMED";
						if (this.activeBlast.systemState.firingState === "FIRED") {
							await this.activeBlast.removeFromBlast(node);
							this.createBlastEvent($happn);
						}
					}
				}

				if (nodeEvents.events.hasOwnProperty("fire_button")) {
					if (
						nodeEvents.events["fire_button"] === 1 &&
						this.activeBlast.systemState.armedState === "ARMED"
					) {
						this.activeBlast.initiateBlast(nodeEvents.modified);
					}
				}
			}

			if (node.data.typeId === 3) {
				if (nodeEvents.events["key_switch_status"] === 1) {
					await this.activeBlast.addToBlast(node);
					//console.log("ADDING CBB");
				}

				// find where the item is
				let blastModel;
				this.blastModels.forEach(async blastElement => {
					let found = blastElement.blastNodes.find(item => item === node);
					if (found !== undefined) {
						blastModel = blastElement;
					}
				});

				if (
					nodeEvents.events["key_switch_status"] === 0 &&
					blastModel.systemState.firingState === "FIRED"
				) {
					await blastModel.removeFromBlast(node);
				}
			}
		} catch (err) {
			logError("Error processing blast events", err);
			return Promise.reject(err);
		}
	};
	return processAsync();
};

module.exports = EventService;
