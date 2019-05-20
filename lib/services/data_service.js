/* eslint-disable no-mixed-spaces-and-tabs */
/* eslint-disable no-unused-vars */
const NodeTreeUtils = require("../utils/node_tree_utils");
const PacketTemplate = require("../constants/packetTemplates");
const Context = require("../models/contextModel");

function DataService() {
	this.__nodeTreeUtil = new NodeTreeUtils();
	this.__constants = new PacketTemplate();
}

DataService.prototype.start = function($happn) {
	const { stateService } = $happn.exchange;
	const { info: logInfo } = $happn.log;

	return new Promise(resolve => {
		logInfo("starting data service");
		stateService.updateState({ service: $happn.name, state: "STARTED" });
		resolve();
	});
};

DataService.prototype.stop = function($happn) {
	const { info: logInfo } = $happn.log;

	return new Promise(resolve => {
		logInfo("stopping data service");
		resolve();
	});
};

/********************************************************************************
 NODE ARRAY DATA SERVICES
 ********************************************************************************/

/***
 * @summary Async function that performs an insert or update for each node in a set of incoming nodes, depending
 *  on whether or not a particular node already exists.
 * @param $happn
 * @param nodeArr - parsed node data that has been received from the IBC
 */
DataService.prototype.upsertNodeDataArr = function($happn, nodeArr) {
	const { nodeRepository, dataService } = $happn.exchange;
	const { info: logInfo, error: logError } = $happn.log;

	let context;

	const buildContext = async () => {
		try {
			const { typeId, serial } = nodeArr[0].data;

			const branch = await nodeRepository.getNodeTree(typeId, serial);

			context = new Context(nodeArr, branch);
			await this.__nodeTreeUtil.extractUpdates($happn, context);
		} catch (err) {
			logError("BuildTree error", err);
			return Promise.reject(err);
		}
	};

	let reorderWindowIdsAsync = async () => {
		//shuffle the window id's for those IB651's that already exist in the DB, but have a different ordering
		// if (config.systemType === "IBS") {
		// 	const { updateNodes: nodesToUpdate } = context;
		// 	try {
		// 		logInfo("NODE UPSERT -  REORDERING WINDOW IDS");
		// 		let reshuffle = await this.__reshuffleWindowIds(nodeArr, nodesToUpdate);
		// 		context.updateNodes = reshuffle;
		// 	} catch (err) {
		// 		logError("reorder error", err);
		// 		return Promise.reject(err);
		// 	}
		// }
	};

	let performUpdateAsync = async () => {
		const { updateNodes, newNodes, missingNodes } = context;

		try {
			if (updateNodes.length > 0) {
				logInfo("NODE UPSERT - UPDATE EXISTING NODES...", updateNodes.length);
				await this.__updateExistingNodes($happn, context);
			}
			if (newNodes.length > 0) {
				logInfo("NODE UPSERT - INSERT NEW NODES...", newNodes.length);
				await this.__insertNewNodes($happn, context);
			}
			if (missingNodes.length > 0) {
				logInfo(
					"NODE UPSERT - UPDATE COMMS ON MISSING...",
					missingNodes.length
				);
				await this.__updateMissingNodes($happn, context);
			}
		} catch (err) {
			logError("Perform Update Error", err);
			return Promise.reject(err);
		}
	};

	const processUpsert = async () => {
		try {
			let eddSig = await dataService.clearEddSignal(nodeArr);

			if (eddSig) {
				nodeArr = nodeArr.slice(0, 1);
				logInfo(`EDD clear signal for CBB ${nodeArr[0].data.serial}`);
				return Promise.resolve();
			}

			await buildContext();
			//await reorderWindowIdsAsync();
			await performUpdateAsync();
		} catch (err) {
			logError("Process Upsert error.............", err);
			return Promise.reject(err);
		}
	};

	return processUpsert();
};

/***
 * @summary Handle the node inserts from the CONTEXT.NEWNODES
 * @param $happn
 * @param nodeArr - node array containing 1 cbb and 1 edd
 */
DataService.prototype.clearEddSignal = function($happn, nodeArr) {
	const { nodeRepository, archiveRepository } = $happn.exchange;

	let clearEddsAsync = async () => {
		if (nodeArr.length < 2 || nodeArr[0].data.typeId !== 3) {
			return Promise.resolve(false);
		}

		const parent = nodeArr[0];

		//clear EDDs when typeId is 4, and UID is 255.255.255.255
		let clearSignal = nodeArr.find(
			node => node.data.typeId === 4 && node.data.serial === 4294967295
		);

		if (!clearSignal) {
			return Promise.resolve(false);
		}

		let parentPath = `${parent.data.typeId}/${parent.data.serial}`;

		const cutData = await nodeRepository.cutPath(parentPath);
		const cutMapped = cutData.map(x => {
			delete x._meta;
			return x;
		});

		const archive = {
			date: parent.meta.storedPacketDate,
			path: parentPath,
			data: cutMapped
		};

		await archiveRepository.insertArchives(archive);

		return true;
	};

	return clearEddsAsync();
};

/***
 * @summary Handle the node inserts from the CONTEXT.NEWNODES
 * @param $happn
 * @param context - data context which stores context.newnodes
 */
DataService.prototype.__insertNewNodes = function($happn, context) {
	const { error: logError } = $happn.log;
	const { nodeRepository } = $happn.exchange;

	let insertNewAsync = async () => {
		for (const node of context.newNodes) {
			try {
				node.data.created = node.meta.storedPacketDate;
				node.data.modified = node.meta.storedPacketDate;
				await node.setPath();
				const nodeClone = { ...node.data };

				await nodeRepository.insertNodeData(nodeClone);
			} catch (err) {
				logError(`Insert Node Error: ${JSON.stringify(node, null, 2)}`);
				return Promise.reject(err);
			}
		}
	};

	return insertNewAsync();
};

DataService.prototype.__updateExistingNodes = function($happn, context) {
	const { error: logError } = $happn.log;
	const { nodeRepository } = $happn.exchange;

	let updateExistingAsync = async () => {
		for (const node of context.updateNodes) {
			const { data, meta } = node;
			try {
				if (data.serial != null && meta.dirty) {
					node.data.modified = node.meta.storedPacketDate;
					await node.setPath();

					let changedObject = {
						serial: data.serial,
						typeId: data.typeId,
						path: data.path,
						modified: meta.storedPacketDate,
						changes: meta.dirty
					};

					$happn.emit("nodes/updated", changedObject);
					//await this.__updateNode($happn, node);

					let nodeClone = { ...node.data };
					nodeRepository.insertNodeData(nodeClone);
				}
			} catch (err) {
				logError(`error updating  ${JSON.stringify(node, null, 2)} -  ${err} `);
				return Promise.reject(err);
			}
		}
	};
	return updateExistingAsync();
};

DataService.prototype.__updateMissingNodes = function($happn, context) {
	const { error: logError } = $happn.log;

	let updateMissingAsync = async () => {
		for (const node of context.missingNodes) {
			const { data: nodeData } = node;

			try {
				//change the communicationStatus to 0 for all missing nodes
				if (nodeData.typeId == 2 || nodeData.typeId == 3) {
					nodeData.communicationStatus = 0;
				}

				//also change the windowId to 0 so the node will be excluded from data mapping
				if (nodeData.typeId != 4) {
					nodeData.windowId = 0;
				}

				//await this.__updateNode($happn, node);
			} catch (err) {
				logError(`error updaing missing node ${node}  ${err}`);
				return Promise.reject(err);
			}
		}
	};

	return updateMissingAsync();
};

/*************************************************************
 * PARENT AND WINDOW ID FUNCTIONS
 **************************************************************
 */

/***
 * @summary If the ordering of a set of IB651s change in a ping request, this reshuffles previously saved IB651 window ids
 * @param nodeArr
 * @param updateNodes
 * @private
 */
DataService.prototype.__reshuffleWindowIds = function(nodeArr, updateNodes) {
	let reshuffleAsync = async () => {
		try {
			for (const inNode of nodeArr) {
				let { data: inNodeData } = inNode;

				if (inNodeData.typeId === 2) {
					for (const nodeUpdate of updateNodes) {
						if (
							inNodeData.typeId == nodeUpdate.data.typeId &&
							inNodeData.serial == nodeUpdate.data.serial
						) {
							nodeUpdate.data.windowId = inNodeData.windowId;
						}
					}
				}
			}
			return updateNodes;
		} catch (err) {
			console.log("Error reshuffling nodes : ", err);
			return Promise.reject(err);
		}
	};
	return reshuffleAsync();
};

/***
 * @summary Modifies a specific node's parent_id, coordinates and windowId by reference.
 * @param currentNode
 * @param branch
 * @private
 */
DataService.prototype.__setParentId = function(currentNode, branch) {
	let parentId = null;

	let parent = this.__nodeTreeUtil.findParent(branch, currentNode.data.typeId);

	if (parent !== null) {
		parentId = parent.data.id;
		currentNode.data.parentSerial = parentId;
	}

	switch (currentNode.data.typeId) {
	case 1: // ISC
		currentNode.data.windowId = 0;
		break;
	}
};

module.exports = DataService;
