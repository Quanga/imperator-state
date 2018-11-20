function EventService() {
	const PacketTemplate = require("../constants/packetTemplates");
	this.__constants = new PacketTemplate();

	const BlastModel = require("../models/blastModel");
	this.__logConstants = this.__constants.loggables;
	this.__warnConstants = this.__constants.warnables;

	this.blastModel = new BlastModel(new Date());
	this.dataModel = [];
}

EventService.prototype.initialise = function($happn) {
	const { nodeRepository } = $happn.exchange;
	const { error: logError, info: logInfo } = $happn.log;

	const initAsync = async () => {
		try {
			logInfo("initialise Event Service .................. STARTED");

			this.dataModel = await nodeRepository.getAllNodes();

			//check the model and report any issues
		} catch (err) {
			logError("initialize Event Service.................... FAIL");
			return Promise.reject(err);
		}
	};

	return initAsync();
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

EventService.prototype.addNode = function($happn, node) {
	const { addNodeAsync: logError } = $happn.log;
	const addModelAsync = async () => {
		try {
			this.dataModel.push(node);
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

	const updateNodeAsync = async () => {
		try {
			//find the node
			let nodeToUpdate = this.dataModel.find(
				dataNode =>
					dataNode.serial === node.serial && dataNode.type_id === node.type_id
			);

			if (nodeToUpdate != undefined) {
				nodeToUpdate = node;
			}

			//update it
			//return this.dataModel;
		} catch (err) {
			logError("error getting model");
			return Promise.reject(err);
		}
	};
	return updateNodeAsync();
};

EventService.prototype.handleFireButton = function($happn, nodeArr, context) {
	const { error: logError } = $happn.log;
	const { fullTree } = context;
	const parent = nodeArr[0];

	let handleFireAsync = async () => {
		try {
			if (parent.type_id === 0 && parent.fire_button === 1) {
				fullTree.forEach(nodeObj => {
					if (nodeObj.type_id === 2) {
						nodeObj.booster_fired_lfs = 0;
						nodeObj.detonator_lfs =
							nodeObj.detonator_status === 0 ? "No detonator" : "Not fired";
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

EventService.prototype.processLogs = function($happn, context) {
	const { error: logError } = $happn.log;
	const { logsRepository, warningsRepository } = $happn.exchange;

	let newLogs = [];
	let newWarnings = [];

	let mapProps = async (newNode, ables, returnList, condition) => {
		try {
			for (const key in newNode) {
				if (ables[key] !== undefined) {
					let propResult = newNode[key];
					if (propResult != null) {
						if (newNode[key] != null) {
							let message;
							if (ables[key][newNode.type_id]) {
								if (condition !== undefined) {
									if (!condition || condition === propResult) {
										message = ables[key][newNode.type_id][propResult];
									}
								} else {
									message = ables[key][newNode.type_id][propResult];
								}
							} else {
								if (condition !== undefined) {
									if (condition === propResult) {
										message = ables[key]["default"][propResult];
									}
								} else {
									message = ables[key]["default"][propResult];
								}
							}
							if (message) {
								let answer = message(newNode.serial, newNode.type_id);

								let timestamp;
								if (newNode.storedPacketDate) {
									timestamp = new Date(newNode.storedPacketDate)
										.toISOString()
										.slice(0, 19)
										.replace("T", " ");
								} else {
									timestamp = newNode.created;
								}

								let res = {
									serial: newNode.serial,
									typeId: newNode.type_id,
									key: key,
									value: propResult,
									message: answer,
									created: timestamp
								};
								returnList.push(res);
							}
						}
					}
				}
			}
		} catch (err) {
			logError(`mapping error ${newNode} -- ${err}`);
		}
	};

	let Process = async () => {
		//1.  take the context and create logs and warnings for New nodes
		for (const newNode of context.newNodes) {
			await mapProps(newNode, this.__logConstants, newLogs);
			await mapProps(newNode, this.__warnConstants, newWarnings, 1);
		}
		//2. take the context and create logs and warnings for updated nodes
		for (const updatedNode of context.updateNodes) {
			if (updatedNode.dirty && updatedNode.dirty.length > 0) {
				//- get the dirty variable and create logs and warnings
				let deconDirty = updatedNode.dirty.reduce((accum, [k, v]) => {
					accum[k] = v["incoming"];
					return accum;
				}, {});

				deconDirty.serial = updatedNode.serial;
				deconDirty.type_id = updatedNode.type_id;

				await mapProps(deconDirty, this.__logConstants, newLogs);
				await mapProps(deconDirty, this.__warnConstants, newWarnings, 1);
			}
		}

		if (newLogs.length > 0) {
			this.persist($happn, newLogs, logsRepository);
			this.emitChange($happn, context);
		}

		if (newWarnings.length > 0) {
			this.persist($happn, newWarnings, warningsRepository);
			this.emitChange($happn, context);
		}
	};
	return Process();
};

EventService.prototype.persist = function($happn, Arr, repository) {
	const { error: logError } = $happn.log;
	try {
		Arr.forEach(log => {
			//logInfo("Saving log/warning for", log);
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
			logInfo("CHECK FOR EDD CLEAR");
			if (nodeArr) {
				let clearSignal = nodeArr.find(
					//clear EDDs when type_id is 4, and UID is 255.255.255.255
					node => node.type_id == 4 && node.serial == 4294967295
				);

				if (clearSignal) {
					logInfo("running clear signal");
					let parentInfo = await nodeRepository.getNode(
						clearSignal.parent_serial,
						clearSignal.parent_type
					);

					await nodeRepository.archiveEdds(parentInfo[0]);
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

module.exports = EventService;
