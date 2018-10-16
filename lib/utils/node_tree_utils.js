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
		// console.log(`Incoming node Array --------- ${JSON.stringify(nodeArr, null, 2)}`);
		//let nodeArr = await JSON.parse(JSON.stringify(incomingNodeArr));
		//console.log(`nodearr clone  - ${JSON.stringify(incomingNodeArr, null, 2)}`);

		//let contextClone = await JSON.parse(JSON.stringify(context));
		///console.log(`context clone  - ${JSON.stringify(contextClone, null, 2)}`);

		let fullTree = context.fullTree;
		let subTree = context.subTree;

		try {
			// console.log("incoming to extract >>>>>>>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(fullTree, null, 2) );
			//Loop through the nodes and see what is new and what needs to be updated
			for (let node of nodeArr) {
				if (subTree == null || subTree.length == 0) subTree = result.newNodes;

				let pos = nodeArr.indexOf(node);
				let updateNodeSerial = await this.setSerialByPosition(
					node,
					subTree,
					pos,
					nodeArr.length
				);

				node.serial = updateNodeSerial.serial;

				// Check if the node exists in the context
				let nodeToUpdate = fullTree.find(
					fullTreeNode =>
						parseInt(node.type_id) === parseInt(fullTreeNode.type_id) &&
						parseInt(node.serial) === parseInt(fullTreeNode.serial)
				);

				if (nodeToUpdate) {
					// UPDATED NODES
					//node.status = "matched";

					nodeToUpdate.status = "matched";
					let mappedNode = await dataMapper.mapUpdateNode(node, nodeToUpdate);
					//node = mappedNode;
					await result.updateNodes.push(mappedNode);
				} else {
					// NEW NODES
					node.happn_path = this.buildHappnPath(node, subTree);
					await result.newNodes.push(node);
				}
			}
			// MISSING NODES
			for (const fullTreeNode of fullTree) {
				//fullTree.forEach(fullTreeNode => {
				if (!fullTreeNode.status) {
					await result.missingNodes.push(fullTreeNode);
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
 * @param fulltree
 * @param parentSerial
 * @param parentTypeId
 */
NodeTreeUtils.prototype.findSubTree = function(
	fullTree,
	parentSerial,
	parentTypeId
) {
	const findSubTreeAsync = async () => {
		// get the parent by serial and type
		try {
			let result = [];

			let parent = await fullTree.find(
				item =>
					parseInt(item.serial) === parseInt(parentSerial) &&
					parseInt(item.type_id) === parseInt(parentTypeId)
			);

			if (parent) {
				result.push(parent);
				// now we can find children by their parent ids
				let findBranch = async (arr, parentId) => {
					// get all children with the same parent
					let childArr = await arr.filter(item => item.parent_id == parentId);

					if (childArr.length > 0) {
						// add children to result
						//let resultClone = JSON.parse(JSON.stringify(result));
						result = await result.concat(childArr);
						// iterate the children and get their children....
						for (let child of childArr) {
							await findBranch(arr, child.id);
						}
					}
				};

				await findBranch(fullTree, parent.id);

				if (result) {
					return result;
				} else {
					return [];
				}
			}
		} catch (err) {
			console.log("Sub tree error", err);
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

	//let parent;
	let subPath = "/" + incomingNode.type_id + "/" + incomingNode.serial;

	let parent = this.findParent(subTree, incomingNode.type_id);

	if (parent)
		return (
			parent.happn_path + "/" + incomingNode.type_id + "/" + incomingNode.serial
		);

	// fallback when no parent can be found
	if (incomingNode.type_id == 1) return "/0/*" + subPath;

	if (incomingNode.type_id == 2) return "/0/*/1/*" + subPath;
	if (incomingNode.type_id == 3) return "/0/*" + subPath;
	if (incomingNode.type_id == 4) return "/0/*/3/*" + subPath;
};

NodeTreeUtils.prototype.setSerialByPosition = function(
	incomingNode,
	subTree,
	pos,
	len
) {
	let setSerialAsync = async () => {
		//return if there is no sub-tree
		try {
			// console.log(
			// 	`!!!!!!!!!!!!set by serial --- incomin node ser-- ${
			// 		incomingNode.serial
			// 	}  my type-- ${incomingNode.type_id}  my parentType-- ${
			// 		incomingNode.parent_type
			// 	}  my parentSerial-- ${incomingNode.parent_serial} windowId-- ${
			// 		incomingNode.window_id
			// 	}

			// subtree length-${subTree.length}  pos-- ${pos}  incoming len ${len}`
			// );

			if (subTree === null || subTree.length === 0) {
				return incomingNode;
			}

			if (incomingNode.serial === null) {
				if (incomingNode.type_id == 2) {
					if (subTree[0].window_id == len - 1) {
						let ib651 = subTree.find(
							c => parseInt(c.type_id) === 2 && parseInt(c.window_id) === pos
						);

						if (ib651) {
							incomingNode.serial = parseInt(ib651.serial);
						}
					}
				}

				// if (incomingNode.type_id == 4) {
				// 	if (subTree[0].window_id == len - 1) {
				// 		let edd = subTree.find(c => c.type_id == 4 && c.window_id == pos);

				// 		if (edd) {
				// 			incomingNode.serial = parseInt(edd.serial);
				// 		}
				// 	}
				// }
			}
			// console.log(
			// 	`RETURNING SERIAL FOR ${JSON.stringify(incomingNode.serial, null, 2)}`
			// );
			return incomingNode;
		} catch (err) {
			console.log.error("set by serial error", err);
		}
	};
	return setSerialAsync();
};

module.exports = NodeTreeUtils;
