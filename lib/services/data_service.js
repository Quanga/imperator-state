function DataService() {
	const NodeTreeUtils = require("../utils/node_tree_utils");
	this.__nodeTreeHelper = new NodeTreeUtils();

	const PacketTemplate = require("../constants/packetTemplates");
	this.__constants = new PacketTemplate();
}

/********************************************************************************
 PACKET DATA SERVICES
 ********************************************************************************/

/***
 * @summary Async function that takes the packet array and inserts inserts it into the packet database
 * @param $happn
 * @param packetArr - parsed node data that has been received from the IBC
 */
DataService.prototype.insertPacketArr = function($happn, packetArr) {
	const { packetRepository, dataMapper } = $happn.exchange;
	const { error: logError } = $happn.log;

	const insertPacketArrAsync = async () => {
		for (const packet of packetArr) {
			try {
				let mappedPacket = await dataMapper.mapInsertPacket(packet);
				let result = await packetRepository.insertPacketArr(mappedPacket);
				return result;
			} catch (err) {
				logError("insertPacketArr update error", err);
			}
		}
	};

	return insertPacketArrAsync();
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
	const { eventService } = $happn.exchange;
	const { info: logInfo, error: logError } = $happn.log;
	const Context = require("../models/contextModel");

	let fullTree = [];
	// the subtree is a subset of existing tree, starting from the incoming parent node
	let subTree = [];
	let context;

	const buildTreeAsync = async () => {
		try {
			fullTree = await this.__buildTree($happn);

			//get sub tree for the begining node of this packet (eg if this packet is for isc3
			//if should find the ibc, and then any connected i651s)
			if (fullTree.length > 0) {
				if (nodeArr[0].type_id === 0) {
					subTree = fullTree;
				} else {
					subTree = await this.__nodeTreeHelper.findSubTree(
						fullTree,
						nodeArr[0].serial,
						nodeArr[0].type_id
					);
				}
			}

			context = new Context(fullTree, subTree);
		} catch (err) {
			logError("BuildTree error", err);
			return Promise.reject(err);
		}
	};

	let checkTreeAsync = async () => {
		logInfo("NODE UPSERT - NEW, UPDATED & MISSING NODES...");
		try {
			let extracted = await this.__nodeTreeHelper.extractNewAndUpdatedNodes(
				$happn,
				context,
				nodeArr
			);

			context.newNodes = extracted.newNodes;
			context.updateNodes = extracted.updateNodes;
			context.missingNodes = extracted.missingNodes;
		} catch (err) {
			logError("Build new and missing  error", err);
			return Promise.reject(err);
		}
	};

	let reorderWindowIdsAsync = async () => {
		logInfo("NODE UPSERT -  REORDERING WINDOW IDS");
		const { updateNodes: nodesToUpdate } = context;
		//shuffle the window id's for those IB651's that already exist in the DB, but have a different ordering
		//TODO need to figure this
		try {
			let reshuffle = await this.__reshuffleWindowIds(nodeArr, nodesToUpdate);
			context.updateNodes = reshuffle;
		} catch (err) {
			logError("reorder error", err);
			return Promise.reject(err);
		}
	};

	let performUpdateAsync = async () => {
		const { updateNodes: nodesToUpdate } = context;
		logInfo("NODE UPSERT - UPDATE EXISTING NODES...", nodesToUpdate.length);

		try {
			if (nodesToUpdate.length > 0) {
				await this.__updateExistingNodes($happn, context);
			}
		} catch (err) {
			logError("Perform Update Error", err);
			return Promise.reject(err);
		}
	};

	let performInsertAsync = async () => {
		logInfo("NODE UPSERT - INSERT NEW NODES...", context.newNodes.length);
		try {
			if (context.newNodes.length > 0) {
				await this.__insertNewNodes($happn, context);
			}
		} catch (err) {
			logError("Insert error", err);
			return Promise.reject(err);
		}
	};

	const performMissingAsync = async () => {
		logInfo(
			"NODE UPSERT - UPDATE COMMS FOR MISSING NODES...",
			context.missingNodes.length
		);
		try {
			if (context.missingNodes.length > 0) {
				await this.__updateMissingNodes($happn, context);
			}
		} catch (err) {
			logError("Updating Missing Error -", err);
			return Promise.reject(err);
		}
	};

	const processUpsert = async () => {
		try {
			await eventService.checkEddClearSignal(nodeArr);
			await buildTreeAsync();
			await checkTreeAsync();
			await reorderWindowIdsAsync();
			await performUpdateAsync();
			await performInsertAsync();
			await performMissingAsync();
			await eventService.processLogs(context);
		} catch (err) {
			logError("Process Upsert error.............", err);
			return Promise.reject(err);
		}
	};

	return processUpsert();
};

/***
 * @summary Async function which builds a flat array of node objects, each with the full happn_path (tree position)
 * @param $happn
 * @param nodeRepository
 */
DataService.prototype.__buildTree = function($happn) {
	const { error: logError } = $happn.log;
	const { nodeRepository } = $happn.exchange;

	const buildTreeAsync = async () => {
		try {
			let allNodes = await nodeRepository.getAllNodes();

			let controlUnit = allNodes.find(item => item.type_id == 0);
			let iscs = allNodes.filter(item => item.type_id == 1);
			let ib651s = allNodes.filter(item => item.type_id == 2);
			let cbbs = allNodes.filter(item => item.type_id == 3);
			let edds = allNodes.filter(item => item.type_id == 4);

			let controlUnitPath = "/0/";
			let currentPath = "";

			if (controlUnit) {
				controlUnitPath = `${controlUnitPath}${controlUnit.serial}`;
				controlUnit.happn_path = controlUnitPath;
			} else {
				controlUnitPath = `${controlUnitPath}*`;
			}

			if (iscs.length > 0) {
				iscs.forEach(isc => {
					currentPath = `${controlUnitPath}/1/${isc.serial}`;
					isc.happn_path = currentPath;

					ib651s
						.filter(ib651 => ib651.parent_id == isc.id)
						.forEach(
							ib651 => (ib651.happn_path = `${currentPath}/2/${ib651.serial}`)
						);
				});
			} else if (ib651s.length > 0) {
				currentPath = `${controlUnitPath}/1/*`;

				ib651s.forEach(
					ib651 => (ib651.happn_path = `${currentPath}/2/${ib651.serial}`)
				);
			}

			if (cbbs.length > 0) {
				cbbs.forEach(cbb => {
					currentPath = `${controlUnitPath}/1/${cbb.serial}`;
					cbb.happn_path = currentPath;

					edds.filter(edd => edd.parent_id == cbb.id).forEach(edd => {
						edd.happn_path = `${currentPath}/3/${edd.serial}`;
					});
				});
			} else if (edds.length > 0) {
				currentPath = `${controlUnitPath}/3/*`;

				edds.forEach(
					edd => (edd.happn_path = `${currentPath}/4/${edds.serial}`)
				);
			}

			return allNodes;
		} catch (err) {
			logError("Build Tree Error error", err);
			return Promise.reject(err);
		}
	};

	return buildTreeAsync();
};

/***
 * @summary Handle the node inserts from the CONTEXT.NEWNODES
 * @param $happn
 * @param context - data context which stores context.newnodes
 * @param nodeRepository - the repository to handle db writing
 */
DataService.prototype.__insertNewNodes = function($happn, context) {
	let parentId = null;

	let insertNewAsync = async () => {
		for (const node of context.newNodes) {
			try {
				if (
					node.serial !== null &&
					context.subTree &&
					context.subTree.length > 0
				) {
					await this.__setParentId(node, context.subTree);
				} else {
					node.parent_id = parentId;
				}

				let newNode = await this.__insertNode($happn, node);
				if (parentId == null) {
					parentId = newNode;
				}
			} catch (err) {
				$happn.log.error(`Insert Node Error: ${JSON.stringify(node, null, 2)}`);
				return Promise.reject(err);
			}
		}
	};

	return insertNewAsync();
};

DataService.prototype.__insertNode = function($happn, node) {
	const { nodeRepository } = $happn.exchange;

	let insNode = async () => {
		// eg: DISALLOWED_INSERTS=0 disallows all IBC inserts (IBC has type_id=0)
		if (node.serial != null) {
			try {
				let nodeClone = JSON.parse(JSON.stringify(node));
				let timestamp = new Date(nodeClone.storedPacketDate)
					.toISOString()
					.slice(0, 19)
					.replace("T", " ");

				nodeClone.created = timestamp;
				nodeClone.modified = timestamp;

				delete nodeClone.storedPacketDate;

				let nodeId = await nodeRepository.insertNodeData(nodeClone);

				return nodeId;
			} catch (err) {
				$happn.log.error("___Insert Node error", err);
				return Promise.reject(err);
			}
		} else {
			return null;
		}
	};

	return insNode();
};

DataService.prototype.__updateExistingNodes = function($happn, context) {
	const { error: logError } = $happn.log;

	let updateExistingAsync = async () => {
		for (const node of context.updateNodes) {
			try {
				if (node.serial != null && node.dirty) {
					await this.__updateNode($happn, node);
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
	let updateMissingAsync = async () => {
		for (const node of context.missingNodes) {
			try {
				//change the communication_status to 0 for all missing nodes
				if (node.type_id == 2) {
					node.communication_status = 0;
				}

				if (node.type_id == 3) {
					node.communication_status = 0;
				}

				//also change the window_id to 0 so the node will be excluded from data mapping
				if (node.type_id != 4) {
					node.window_id = 0;
				}

				await this.__updateNode($happn, node);
			} catch (err) {
				$happn.log.error(`error updaing missing node ${node}  ${err}`);
				return Promise.reject(err);
			}
		}
	};

	return updateMissingAsync();
};

/***
 * @summary Calls the repository to update the node - alled from UPDATE and MISSING COMMS
 * @param $happn
 * @param repository - the repository to use
 * @param node - the node to update
 */
DataService.prototype.__updateNode = function($happn, node) {
	const { nodeRepository } = $happn.exchange;

	let updateNodeAS = async () => {
		try {
			let nodeClone = JSON.parse(JSON.stringify(node));

			let timestamp = new Date(nodeClone.storedPacketDate)
				.toISOString()
				.slice(0, 19);
			//.replace("T", " ");

			nodeClone.modified = timestamp;

			await nodeRepository.updateNodeData(nodeClone);
		} catch (err) {
			$happn.log.error("UPDATING NODE ERROR>>>> : ", err);
			return Promise.reject(err);
		}
	};

	return updateNodeAS();
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
			for (const incomingNode of nodeArr) {
				if (incomingNode.type_id === 2) {
					for (const nodeUpdate of updateNodes) {
						if (
							incomingNode.type_id == nodeUpdate.type_id &&
							incomingNode.serial === nodeUpdate.serial
						) {
							nodeUpdate.window_id = incomingNode.window_id;
						}
					}
				}
			}
			return updateNodes;
		} catch (err) {
			console.log("RESHUFFLE NODE ERROR>>>> : ", err);
			return Promise.reject(err);
		}
	};
	return reshuffleAsync();
};

/***
 * @summary Modifies a specific node's parent_id, coordinates and window_id by reference.
 * @param currentNode
 * @param subTree
 * @private
 */
DataService.prototype.__setParentId = function(currentNode, subTree) {
	let parentId = null;
	let parent = this.__nodeTreeHelper.findParent(subTree, currentNode.type_id);

	if (parent != null) {
		parentId = parent.id;
	}

	currentNode.parent_id = parentId;

	switch (currentNode.type_id) {
	case 1: // ISC
		currentNode.window_id = 0;
		break;
	}
};

module.exports = DataService;
