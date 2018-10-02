//var asyncs = require("async");

function DataService() {
	const NodeTreeUtils = require("../utils/node_tree_utils");
	this.__nodeTreeHelper = new NodeTreeUtils();
}

/***
 * @summary Async function that takes the packet array and inserts inserts it into the packet database
 * @param $happn
 * @param packetArr - parsed node data that has been received from the IBC
 */
DataService.prototype.insertPacketArr = function($happn, packetArr) {
	var packetRepository = $happn.exchange.packetRepository;
	var dataMapper = $happn.exchange.dataMapper;

	async function insertPacketArrAsync() {
		for (const packet of packetArr) {
			try {
				let mappedPacket = await dataMapper.mapInsertPacket(packet);
				let result = await packetRepository.insertPacketArr(mappedPacket);
				return result;
			} catch (err) {
				$happn.log.error("insertPacketArr update error", err);
			}
		}
	}

	return insertPacketArrAsync();
};

/***
 * @summary Async function that performs an insert or update for each node in a set of incoming nodes, depending
 *  on whether or not a particular node already exists.
 * @param $happn
 * @param nodeArr - parsed node data that has been received from the IBC
 */
DataService.prototype.upsertNodeDataArr = function($happn, nodeArr) {
	const self = this;
	const nodeRepository = $happn.exchange.nodeRepository;

	let fullTree = [];
	let subTree = [];
	let context;

	async function buildTreeAsync() {
		try {
			fullTree = await self.__buildTree($happn, nodeRepository);

			if (fullTree.length > 0) {
				subTree = await self.__nodeTreeHelper.findSubTree(
					fullTree,
					nodeArr[0].serial,
					nodeArr[0].type_id
				);
			}
		} catch (err) {
			$happn.log.error("BuildTree error", err);
		}
	}

	async function buildContextAsync() {
		try {
			context = {
				updateNodes: [],
				newNodes: [],
				missingNodes: [],
				fullTree: fullTree,
				subTree: subTree,
				parentSerial: nodeArr[0].serial,
				parentType: nodeArr[0].type_id,
				updateParent: null
			};
		} catch (err) {
			$happn.log.error("Create Context error", err);
		}
	}

	async function checkTreeAsync() {
		// $happn.log.info(
		// 	"UPSERT STEP 0: BUILDING NEW, UPDATED AND MISSING NODES..."
		// );
		try {
			let extracted = await self.__nodeTreeHelper.extractNewAndUpdatedNodes(
				$happn,
				context,
				nodeArr
			);

			context.newNodes = extracted.newNodes;
			context.updateNodes = extracted.updateNodes;
			context.missingNodes = extracted.missingNodes;
		} catch (err) {
			$happn.log.error("Build new and missing  error", err);
		}
	}

	async function reorderWindowIdsAsync() {
		// $happn.log.info("UPSERT STEP 1: REORDERING WINDOW IDS");
		//shuffle the window id's for those IB651's that already exist in the DB, but have a different ordering
		try {
			let reshuffle = await self.__reshuffleWindowIds(
				nodeArr,
				context.updateNodes
			);
			context.updateNodes = reshuffle;
		} catch (err) {
			$happn.log.error("reorder error", err);
		}
	}

	async function performUpdateAsync() {
		// $happn.log.info(
		// 	"UPSERT STEP 2 - UPDATE EXISTING NODES...",
		// 	context.updateNodes
		// );
		try {
			if (context.updateNodes.length == 0) {
				return;
			} else {
				await self.__updateExistingNodes($happn, context, nodeRepository);
			}
		} catch (err) {
			$happn.log.error("Perform Update Error", err);
		}
	}

	async function performInsertAsync() {
		//$happn.log.info("UPSERT STEP 3 - INSERT NEW NODES...");
		try {
			if (context.newNodes.length == 0) {
				return;
			} else {
				await self.__insertNewNodes($happn, context, nodeRepository);
			}
		} catch (err) {
			$happn.log.error("Insert error", err);
		}
	}

	async function performMissingAsync() {
		//$happn.log.info("UPSERT STEP 4 - UPDATE MISSING NODES...");
		try {
			if (context.missingNodes.length === 0) {
				return;
			} else {
				await self.__updateMissingNodes($happn, context, nodeRepository);
			}
		} catch (err) {
			$happn.log.error("update missing  error", err);
		}
	}

	async function processUpsert() {
		try {
			await buildTreeAsync();
			await buildContextAsync();
			await checkTreeAsync();
			await reorderWindowIdsAsync();
			await performUpdateAsync();
			await performInsertAsync();
			await performMissingAsync();
		} catch (err) {
			$happn.log.error("Process upsert", err);
		}
	}

	return processUpsert();
};

DataService.prototype.getIbcSerials = function($happn) {
	var nodeRepository = $happn.exchange.nodeRepository;

	try {
		return nodeRepository.getIbcSerials();
	} catch (err) {
		$happn.log.error("getIbcSerials error", err);
	}
};

DataService.prototype.getIscSerials = function($happn) {
	var nodeRepository = $happn.exchange.nodeRepository;

	try {
		return nodeRepository.getIscSerials();
	} catch (err) {
		$happn.log.error("getIscSerials error", err);
	}
};

/***
 * @summary Async function which builds a flat array of node objects, each with the full happn_path (tree position)
 * @param $happn
 * @param nodeRepository
 */
DataService.prototype.__buildTree = function($happn, nodeRepository) {
	async function buildTreeAsync() {
		try {
			let allNodes = await nodeRepository.findNodes();

			var ibc = allNodes.find(item => {
				return item.type_id == 0;
			});

			var iscs = allNodes.filter(item => {
				return item.type_id == 1;
			});

			var ib651s = allNodes.filter(item => {
				return item.type_id == 2;
			});

			var ibcPath = "/0/";
			var currentPath = "";

			if (ibc != null) {
				ibcPath = ibcPath + ibc.serial;
				ibc.happn_path = ibcPath;
			} else {
				ibcPath = ibcPath + "*";
			}

			if (iscs.length > 0) {
				iscs.forEach(isc => {
					currentPath = ibcPath + "/1/" + isc.serial;
					isc.happn_path = currentPath;

					ib651s
						.filter(ib651 => {
							return ib651.parent_id == isc.id;
						})
						.forEach(ib651 => {
							ib651.happn_path = currentPath + "/2/" + ib651.serial;
						});
				});
			} else if (ib651s.length > 0) {
				currentPath = ibcPath + "/1/*";

				ib651s.forEach(ib651 => {
					ib651.happn_path = currentPath + "/2/" + ib651.serial;
				});
			}
			return allNodes;
		} catch (err) {
			$happn.log.error("Build Tree Error error", err);
		}
	}
	return buildTreeAsync();
};

DataService.prototype.__insertNewNodes = function(
	$happn,
	context,
	nodeRepository
) {
	var self = this;

	// insertion of nodes will only ever involve one or a maximum of 2 levels, eg:
	// one IBC
	// one IBC & multiple ISCs
	// one or more ISCs - in this case a tree must already exist (with a minimum of 1 IBC in it)
	// one ISC and multiple IB651s - in this case a tree must already exist (with a minimum of 1 IBC in it)
	// one or more IB651s - in this case a tree must already exist (with a minimum of 1 IBC in it)

	var parentId = null;

	async function insertNewAsync() {
		for (const node of context.newNodes) {
			try {
				if (node.serial != null && context.subTree.length > 0) {
					// if a tree was found then the parent_id can be derived
					await self.__setParentId(node, context.subTree);
				} else {
					// no tree is found which means that this must be a new node/set of nodes
					// just grab the nodeId of the previous insert which should be the parent.
					node.parent_id = parentId;
				}

				let newNode = await self.__insertNode($happn, nodeRepository, node);
				if (parentId == null) parentId = newNode;
			} catch (err) {
				$happn.log.error("error inserting node", node);
				$happn.log.error("error inserting node", err);
			}
		}
	}

	return insertNewAsync();
};

DataService.prototype.__insertNode = function($happn, repository, node) {
	var config = $happn.config;

	async function insNode() {
		if (
			node.serial != null &&
			node.type_id > process.env.DISALLOWED_INSERTS && // eg: DISALLOWED_INSERTS=0 disallows all IBC inserts (IBC has type_id=0)
			node.serial < process.env.MAX_SERIAL && //ensures no null nodes are inserted as a result of duplicate widows.
			(!config.disableIb651Inserts || (node.type_id != 2 || node.serial >= 200))
		) {
			try {
				let clone = JSON.parse(JSON.stringify(node));
				let nodeId = await repository.insertNodeData(clone);
				//delete clone.id;

				return nodeId;
			} catch (err) {
				$happn.log.error("___Insert Node error", err);
			}
		} else {
			return null;
		}
	}

	return insNode();
};

DataService.prototype.__updateExistingNodes = function(
	$happn,
	context,
	nodeRepository
) {
	let self = this;

	async function updateExistingAsync() {
		for (const node of context.updateNodes) {
			try {
				if (node.serial != null) {
					await self.__updateNode($happn, nodeRepository, node);
				}
			} catch (err) {
				$happn.log.error("error updating node", node);
				$happn.log.error("error updating node", err);
			}
		}
	}
	return updateExistingAsync();
};

DataService.prototype.__updateMissingNodes = function(
	$happn,
	context,
	nodeRepository
) {
	var self = this;

	async function updateMissingAsync() {
		for (const node of context.missingNodes) {
			try {
				//change the communication_status to 0 for all missing nodes
				if (node.type_id == 2) {
					node.communication_status = 0;
				}

				//also change the window_id to 0 so the node will be excluded from data mapping
				if (node.type_id != 4) {
					node.window_id = 0;
				}

				await self.__updateNode($happn, nodeRepository, node);
			} catch (err) {
				$happn.log.error("error updating missing node", node);
				$happn.log.error("error updating missing node", err);
			}
		}
	}

	return updateMissingAsync();
};

DataService.prototype.__updateNode = function($happn, repository, node) {
	async function updateNodeAS() {
		try {
			let clone = await JSON.parse(JSON.stringify(node));
			await repository.updateNodeData(clone);
		} catch (err) {
			$happn.log.err("UPDATING NODE ERROR>>>> : ", err);
		}
	}

	return updateNodeAS();
};

/***
 * @summary If the ordering of a set of IB651s change in a ping request, this reshuffles previously saved IB651 window ids
 * @param nodeArr
 * @param updateNodes
 * @private
 */
DataService.prototype.__reshuffleWindowIds = function(nodeArr, updateNodes) {
	// the incoming nodeArr has already had window id's added to IB651 nodes in PacketUtils.createPacketResult
	//console.log("node array", nodeArr);
	async function reshuffleAsync() {
		nodeArr.forEach(incomingNode => {
			if (incomingNode.type_id === 2) {
				updateNodes.forEach(nodeUpdate => {
					// TODO: check this - in a situation where the serial of the incoming node is not known?

					if (
						incomingNode.type_id == nodeUpdate.type_id &&
						parseInt(incomingNode.serial) == parseInt(nodeUpdate.serial)
					) {
						//console.log("INCOMING WINDOW ID: ", incomingNode.window_id);
						//console.log("UPDATE NODE WINDOW ID: ", nodeUpdate.window_id);

						nodeUpdate.window_id = incomingNode.window_id;
					}
				});
			}
		});
		//console.log("NODE UPDATES", updateNodes);
		return updateNodes;
	}
	return reshuffleAsync();
};

/***
 * @summary Modifies a specific node's parent_id, coordinates and window_id by reference.
 * @param currentNode
 * @param subTree
 * @private
 */
DataService.prototype.__setParentId = function(currentNode, subTree) {
	let parent = this.__nodeTreeHelper.findParent(subTree, currentNode.type_id);
	let parentId = null;

	if (parent != null) {
		parentId = parent.id;
	}

	switch (currentNode.type_id) {
	case 1: // ISC
		currentNode.parent_id = parentId;
		currentNode.window_id = 0;
		break;
	case 2: // IB651
		currentNode.parent_id = parentId;
		break;
	default:
	}
};

module.exports = DataService;
