function NodeTreeUtils() {}

/**
 * @summary Async function that determines which incoming nodes are new and which already exist,
 *  and hence should be updated. Also determines nodes missing from the incoming packet.
 * @param $happn
 * @param context
 * @param nodeArr
 */
NodeTreeUtils.prototype.extractNewAndUpdatedNodes = function(
	$happn,
	context,
	nodeArr
) {
	const { dataMapper } = $happn.exchange;
	const { error: logError } = $happn.log;

	let result = {
		updateNodes: [],
		newNodes: [],
		missingNodes: []
	};

	let extractNewAndUpdatedNodesAsync = async () => {
		let { allNodes, branch } = context;

		try {
			for (let node of nodeArr) {
				const { data: nodeData } = node;

				if (branch === null || branch.length === 0) {
					branch = result.newNodes;
				}

				let pos = nodeArr.indexOf(node);
				let updateNodeSerial = await this.setSerialByPosition(
					node,
					branch,
					pos,
					nodeArr.length
				);

				nodeData.serial = updateNodeSerial.data.serial;

				// Check if the node exists in the context
				let nodeToUpdate = allNodes.find(
					item =>
						parseInt(nodeData.typeId) == parseInt(item.data.typeId) &&
            parseInt(nodeData.serial) == parseInt(item.data.serial)
				);

				if (nodeToUpdate) {
					// UPDATED NODES
					nodeToUpdate.meta.status = "matched";
					let mappedNode = await dataMapper.mapUpdateNode(node, nodeToUpdate);
					await result.updateNodes.push(mappedNode);
				} else {
					// NEW NODES
					await result.newNodes.push(node);
				}
			}
			// MISSING NODES
			for (const node of context.branch) {
				const { data: nodeData, meta: nodeMeta } = node;
				if (
					!nodeMeta.status &&
          nodeData.typeId !== 4 &&
          nodeData.typeId !== 3
				) {
					//add the stored date from when the missing node was found
					nodeMeta.storedPacketDate = nodeArr[0].meta.storedPacketDate;
					result.missingNodes.push(node);
				} else {
					delete nodeMeta.status;
				}
			}

			return result;
		} catch (err) {
			logError(`Extract trees error -- ${err}`);
		}
	};

	return extractNewAndUpdatedNodesAsync();
};

/**
 * @summary Async function that return a tree from a Parent Serail and TypeId
 * @param allNodes
 * @param parentSerial
 * @param parentTypeId
 */
NodeTreeUtils.prototype.findBranch = function(
	allNodes,
	parentSerial,
	parentTypeId
) {
	const findSubTreeAsync = async () => {
		// get the parent by serial and type
		try {
			let result = [];

			let parent = await allNodes.filter(
				item =>
					item.data.serial == parentSerial && item.data.typeId == parentTypeId
			)[0];

			if (parent != undefined) {
				result.push(parent);
				// now we can find children by their parent ids
				let findBranch = async (arr, parentSerial, parentTypeId) => {
					// get all children with the same parent
					let childArr = arr.filter(item => {
						if (
							item.data.parentSerial == parentSerial &&
              item.data.parentType == parentTypeId
						) {
							return true;
						}
					});

					if (childArr.length > 0) {
						// add children to result
						result = result.concat(childArr);
						// iterate the children and get their children....
						for (let child of childArr) {
							findBranch(arr, child.data.serial, child.data.typeId);
						}
					}
				};

				if (allNodes.length > 1) {
					await findBranch(allNodes, parent.data.serial, parent.data.typeId);
				}
			}
			//console.log("FINDING SUBTREE RESULT", result);

			if (result) {
				return result;
			} else {
				return [];
			}
		} catch (err) {
			return Promise.reject(err);
		}
	};
	return findSubTreeAsync();
};

NodeTreeUtils.prototype.findParent = function(branch, childTypeId) {
	if (childTypeId === 3) {
		return branch.find(item => item.data.typeId === 0);
	}
	return branch.find(item => item.data.typeId === childTypeId - 1);
};

// NodeTreeUtils.prototype.buildHappnPath = function(incomingNode, subTree) {
// 	const { data: nodeData } = incomingNode;
// 	if (nodeData.typeId == 0) return "/0/" + nodeData.serial;

// 	let subPath = `/${nodeData.typeId}/${nodeData.serial}`;
// 	let parent = this.findParent(subTree, nodeData.typeId);

// 	if (parent)
// 		return `${parent.meta.happn_path}/${nodeData.typeId}/${nodeData.serial}`;

// 	// fallback when no parent can be found
// 	if (incomingNode.data.typeId == 1) return `/0/*${subPath}`;
// 	if (incomingNode.data.typeId == 2) return `/0/*/1/*${subPath}`;
// 	if (incomingNode.data.typeId == 3) return `/0/*${subPath}`;
// 	if (incomingNode.data.typeId == 4) return `/0/*/3/*${subPath}`;
// };

NodeTreeUtils.prototype.setSerialByPosition = function(node, branch, pos, len) {
	const { data: nodeData } = node;
	let setSerialAsync = async () => {
		try {
			if (branch === null || branch.length === 0) {
				return node;
			}

			if (nodeData.serial === null) {
				if (nodeData.typeId === 2) {
					if (branch[0].data.windowId === len - 1) {
						let ib651 = branch.find(
							c => c.data.typeId === 2 && c.data.windowId === pos
						);
						if (ib651) {
							nodeData.serial = ib651.data.serial;
						}
					}
				} else {
					for (const branchChild of branch) {
						//the data packet length does not match the ping request;
						if (branchChild.data.windowId === nodeData.windowId) {
							nodeData.serial = branchChild.data.serial;
						}
					}
				}
			}

			return node;
		} catch (err) {
			console.log.error("set by serial error", err);
		}
	};
	return setSerialAsync();
};

module.exports = NodeTreeUtils;
