function EventService() {
	const PacketTemplate = require("../constants/packetTemplates");
	this.__constants = new PacketTemplate();
	this.__logConstants = this.__constants.loggables;
	this.__warnConstants = this.__constants.warnables;
}

EventService.prototype.processLogs = function($happn, context) {
	let newLogs = [];
	let newWarnings = [];
	let updatedLogs = [];
	let updatedWarnings = [];

	let mapProps = async (newNode, ables, returnList) => {
		for (const key in newNode) {
			if (ables[key] !== undefined) {
				//console.log("key- ", key);
				let propResult = newNode[key];
				if (propResult != null) {
					if (newNode[key] != null) {
						//console.log(`mapping ${key} -  with ${key[1]} {}`);
						let res = {
							serial: newNode.serial,
							typeId: newNode.type_id,
							key: key,
							value: propResult
						};
						returnList.push(res);
					}
				}
			}
		}
		return returnList;
	};

	let Process = async () => {
		//1.  take the context and create logs and warnings for New nodes
		// - create a list of all props and then create logs and warnings
		for (const newNode of context.newNodes) {
			//console.log("newNode", newNode);
			let logList = await mapProps(newNode, this.__logConstants, newLogs);
			let warnList = await mapProps(newNode, this.__warnConstants, newWarnings);

			//console.log(`newNode LogList to - ${JSON.stringify(logList, null, 2)}`);
			//console.log(`newNode WarnList to - ${JSON.stringify(warnList, null, 2)}`);
		}
		//2. take the context and create logs and warnings for updated nodes
		//- nodes.updated
		for (const updatedNode of context.updateNodes) {
			if (updatedNode.dirty && updatedNode.dirty.length > 0) {
				//- get the dirty variable and create logs and warnings

				let deconDirty = updatedNode.dirty.reduce((accum, [k, v]) => {
					accum[k] = v["incoming"];
					return accum;
				}, {});

				deconDirty.serial = updatedNode.serial;
				deconDirty.type_id = updatedNode.type_id;

				//console.log("Decon", deconDirty);

				let logListup = await mapProps(
					deconDirty,
					this.__logConstants,
					updatedLogs
				);
				let warnListup = await mapProps(
					deconDirty,
					this.__warnConstants,
					updatedWarnings
				);

				// console.log(
				// 	`updNode LogList to - ${JSON.stringify(logListup, null, 2)}`
				// );
				// console.log(
				// 	`updNode WarnList from ${JSON.stringify(
				// 		deconDirty
				// 	)}to - ${JSON.stringify(warnListup, null, 2)}`
				// );
			}
		}
	};
	return Process();
};

EventService.prototype.logUpdateEvent = function($happn, context) {
	const { error: logError, info: logInfo } = $happn.log;
	const { logsRepository } = $happn.exchange;
	const { updateNodes: nodesToUpdate } = context;
	let self = this;

	let logUpdateAsync = async () => {
		try {
			logInfo("LOGGING CHANGES FOR CHILDREN");
			if (nodesToUpdate.length > 0) {
				for (const updatedNode of context.updateNodes) {
					if (updatedNode.serial != null) {
						if (updatedNode.dirty) {
							let updatedNodeLogs = await self.__createLogs(
								$happn,
								updatedNode
							);
							let logconcact = context.logs.concat(updatedNodeLogs);
							context.logs = logconcact; //Log each change
						}
					}
				}

				context.logs.forEach(createdLog => {
					logsRepository.insertLogData(createdLog);
				});

				this.emitChange($happn, context);
			}
		} catch (err) {
			logError("Log Error", err);
			return Promise.reject(err);
		}
	};

	return logUpdateAsync();
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

/*************************************************************
 * LOGS FUNCTIONS
 **************************************************************
 */

/***
 * @summary
 * @param $happn
 * @param updatedNode
 * @param treeNode
 * @param log
 * @param logCount
 * @private
 */
EventService.prototype.__createLogs = function($happn, updatedNode) {
	const { unitBitTemplate } = this.__constants;

	let createLogsAsync = async () => {
		let objectLogs = [];

		if (updatedNode.type_id < 4) {
			let constantData = unitBitTemplate[updatedNode.type_id];

			updatedNode.dirty.forEach(changedProp => {
				let logItem = this.createLogResultObject();
				try {
					if (changedProp[0] != "window_id") {
						let incomingVal = changedProp[1]["incoming"];
						let constData = constantData.bits[changedProp[0]];

						logItem.node_serial = updatedNode.serial;

						logItem.message = `${constData.desc} is ${
							incomingVal == 1 ? constData.val[0] : constData.val[1]
						}`;
						objectLogs.push(logItem);
					}
				} catch (err) {
					console.log("log error", err);
					return Promise.reject(err);
				}
			});

			console.log(
				`will need to write the following logs -  ${JSON.stringify(
					objectLogs,
					null,
					2
				)}`
			);
		}
		return objectLogs;
	};
	return createLogsAsync();
};

EventService.prototype.createLogResultObject = function() {
	return {
		node_serial: null,
		message: null
	};
};

module.exports = EventService;
