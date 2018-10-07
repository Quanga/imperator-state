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
	var dataMapper = $happn.exchange.dataMapper;

	var fullTree = context.fullTree;
	var subTree = context.subTree;

	let extractNewAndUpdatedNodesAsync = async () => {
		var result = {
			updateNodes: [],
			newNodes: [],
			missingNodes: []
		};

		//Loop through the nodes and see what is new and what needs to be updated
		for (const node of nodeArr) {
			if (subTree == null || subTree.length == 0) {
				subTree = result.newNodes;
			}

			try {
				let pos = nodeArr.indexOf(node);
				let updateNodeSerial = await this.setSerialByPosition(
					node,
					subTree,
					pos,
					nodeArr.length
				);
				node.serial = updateNodeSerial.serial;
			} catch (err) {
				console.log("ERROR 1", err, context);
			}

			// Check if the node exists in the context
			var updateNode = fullTree.find(treeNode => {
				return (
					node.type_id == treeNode.type_id &&
					parseInt(node.serial) == parseInt(treeNode.serial)
				);
			});

			if (updateNode != undefined) {
				updateNode.status = "matched";
				try {
					// UPDATED NODES
					let mappedNode = await dataMapper.mapUpdateNode(node, updateNode);
					result.updateNodes.push(mappedNode);
				} catch (err) {
					$happn.log.error("extract error", err);
				}
			} else {
				// NEW NODES
				node.happn_path = this.buildHappnPath(node, subTree);
				result.newNodes.push(node);
			}
		}
		// MISSING NODES
		fullTree.forEach(treeNode => {
			if (treeNode.status != "matched") result.missingNodes.push(treeNode);
		});
		return result;
	};

	return extractNewAndUpdatedNodesAsync();
};

/**
 * @summary Async function that return a tree from a Parent Serail and TypeId
 * @param fulltree
 * @param parentSerial
 * @param parentTypeId
 */
NodeTreeUtils.prototype.findSubTree = function(
	fullTree,
	parentSerial,
	parentTypeId
) {
	let result = [];

	let findSubTreeAsync = async () => {
		// get the parent by serial and type
		let parent = fullTree.find(item => {
			return item.serial == parentSerial && item.type_id == parentTypeId;
		});

		if (parent != undefined) {
			await result.push(parent);

			// now we can find children by their parent ids
			let findBranch = async function(arr, parentId) {
				// get all children with the same parent
				let childArr = arr.filter(item => item.parent_id === parentId);

				if (childArr.length > 0) {
					// add children to result
					result = [...result, ...childArr];

					// iterate the children and get their children....
					for (const child of childArr) {
						await findBranch(arr, child.id);
					}
				}
			};

			await findBranch(fullTree, parent.id);
			if (result != undefined) {
				return result;
			} else {
				return [];
			}
		}
	};
	return findSubTreeAsync();
};

NodeTreeUtils.prototype.findParent = function(subTree, childTypeId) {
	return subTree.find(item => item.type_id === childTypeId - 1);
};

NodeTreeUtils.prototype.buildHappnPath = function(incomingNode, subTree) {
	// IBC
	if (incomingNode.type_id == 0) return "/0/" + incomingNode.serial;

	var parent;
	var subPath = "/" + incomingNode.type_id + "/" + incomingNode.serial;

	parent = this.findParent(subTree, incomingNode.type_id);

	if (parent != null)
		return (
			parent.happn_path + "/" + incomingNode.type_id + "/" + incomingNode.serial
		);

	// fallback when no parent can be found
	if (incomingNode.type_id == 1) return "/0/*" + subPath;

	if (incomingNode.type_id == 2) return "/0/*/1/*" + subPath;
};

NodeTreeUtils.prototype.setSerialByPosition = function(
	incomingNode,
	subTree,
	pos,
	len
) {
	let setSerialAsync = async () => {
		//return if there is no sub-tree
		if (subTree === null || subTree.length === 0) {
			return incomingNode;
		}

		if (incomingNode.serial === null) {
			if (subTree[0].window_id == len - 1) {
				var ib651 = subTree.find(c => {
					return c.type_id == 2 && c.window_id == pos;
				});

				if (ib651 != null) {
					incomingNode.serial = parseInt(ib651.serial);
				}
			}
		}
		return incomingNode;
	};
	return setSerialAsync();
};

module.exports = NodeTreeUtils;
