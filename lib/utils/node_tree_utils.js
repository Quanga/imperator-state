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
						parseInt(nodeData.type_id) == parseInt(item.data.type_id) &&
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
					nodeData.type_id !== 4 &&
					nodeData.type_id !== 3
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

			let parent = await allNodes.find(
				item =>
					item.data.serial == parentSerial && item.data.type_id == parentTypeId
			);

			if (parent != undefined) {
				result.push(parent);
				// now we can find children by their parent ids
				let findBranch = async (arr, parentId) => {
					// get all children with the same parent
					let childArr = arr.filter(item => item.data.parent_id === parentId);

					if (childArr.length > 0) {
						// add children to result
						result = result.concat(childArr);
						// iterate the children and get their children....
						for (let child of childArr) {
							findBranch(arr, child.data.id);
						}
					}
				};

				if (allNodes.length > 1) {
					await findBranch(allNodes, parent.data.id);
				}
			}

			if (result) {
				return result;
			} else {
				return [];
			}
		} catch (err) {
			console.log("branch error", err);
		}
	};
	return findSubTreeAsync();
};

NodeTreeUtils.prototype.findParent = function(branch, childTypeId) {
	if (childTypeId === 3) {
		return branch.find(item => item.data.type_id === 0);
	}
	return branch.find(item => item.data.type_id === childTypeId - 1);
};

// NodeTreeUtils.prototype.buildHappnPath = function(incomingNode, subTree) {
// 	const { data: nodeData } = incomingNode;
// 	if (nodeData.type_id == 0) return "/0/" + nodeData.serial;

// 	let subPath = `/${nodeData.type_id}/${nodeData.serial}`;
// 	let parent = this.findParent(subTree, nodeData.type_id);

// 	if (parent)
// 		return `${parent.meta.happn_path}/${nodeData.type_id}/${nodeData.serial}`;

// 	// fallback when no parent can be found
// 	if (incomingNode.data.type_id == 1) return `/0/*${subPath}`;
// 	if (incomingNode.data.type_id == 2) return `/0/*/1/*${subPath}`;
// 	if (incomingNode.data.type_id == 3) return `/0/*${subPath}`;
// 	if (incomingNode.data.type_id == 4) return `/0/*/3/*${subPath}`;
// };

NodeTreeUtils.prototype.setSerialByPosition = function(node, branch, pos, len) {
	const { data: nodeData } = node;
	let setSerialAsync = async () => {
		// console.log("BRANCH ", branch);
		// console.log("NODE ", node);
		// console.log("LENGT ", len);
		// console.log("POS ", pos);

		try {
			if (branch === null || branch.length === 0) {
				return node;
			}

			if (nodeData.serial === null) {
				if (nodeData.type_id === 2) {
					if (branch[0].data.window_id === len - 1) {
						let ib651 = branch.find(
							c => c.data.type_id === 2 && c.data.window_id === pos
						);
						if (ib651) {
							nodeData.serial = ib651.data.serial;
						}
					}
				} else {
					for (const branchChild of branch) {
						//the data packet length does not match the ping request;
						if (branchChild.data.window_id === nodeData.window_id) {
							nodeData.serial = branchChild.data.serial;
						}
					}
				}
			}
			//console.log("UPDATED NODE ", node);

			return node;
		} catch (err) {
			console.log.error("set by serial error", err);
		}
	};
	return setSerialAsync();
};

module.exports = NodeTreeUtils;
