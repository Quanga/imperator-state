function EventService() {
	const PacketTemplate = require("../constants/packetTemplates");
	this.__constants = new PacketTemplate();
	this.__logConstants = this.__constants.loggables;
	this.__warnConstants = this.__constants.warnables;
}

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
					//console.log("PROPRESULT ====", propResult);
					if (propResult != null) {
						if (newNode[key] != null) {
							//let message = ables[key][newNode.type_id][propResult];
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

								let res = {
									serial: newNode.serial,
									typeId: newNode.type_id,
									key: key,
									value: propResult,
									message: answer
								};
								returnList.push(res);
							}
						}
					}
				}
			}
		} catch (err) {
			logError("mapping error", newNode);
			logError("mapping error", err);
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
