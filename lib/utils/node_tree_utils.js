var async = require('async');

function NodeTreeUtils() {}

/**
 *
 * @summary A function that determines which incoming nodes are new and which already exist,
 *  and hence should be updated. Also determines nodes missing from the incoming packet.
 * @param $happn
 * @param context
 * @param nodeArr
 * @param callback
 */
NodeTreeUtils.prototype.extractNewAndUpdatedNodes = function ($happn, context, nodeArr, callback) {

	var self = this;

	var dataMapper = $happn.exchange.dataMapper;

	var fullTree = context.fullTree;
	var subTree = context.subTree;

	var result = {
		updateNodes: [],
		newNodes: [],
		missingNodes: []
	};

	async.eachOf(nodeArr, function (incomingNode, pos, cb) {

		if (subTree == null || subTree.length == 0)
			subTree = result.newNodes;

		self.setSerialByPosition(incomingNode, subTree, pos, nodeArr.length);

		// UPDATED
		var updateNode = fullTree.find(treeNode => {
			return ((incomingNode.type_id == treeNode.type_id) &&
                (parseInt(incomingNode.serial) == parseInt(treeNode.serial)));
		});

		if (updateNode) {
			updateNode.status = 'matched';

			dataMapper.mapUpdateNode(incomingNode, updateNode)
				.then(function () {
					result.updateNodes.push(updateNode);
					return cb();
				})
				.catch(function (err) {
					return cb(err);
				});
		} else {
			// NEW
			incomingNode.happn_path = self.buildHappnPath(incomingNode, subTree);
			result.newNodes.push(incomingNode);
			return cb();
		}
	}, function (err) {
		if (err)
			return callback(err);

		// MISSING
		fullTree.forEach(treeNode => {
			if (!treeNode.status)
				result.missingNodes.push(treeNode);
		});

		callback(null, result);

	});
};

NodeTreeUtils.prototype.findSubTree = function (fullTree, parentSerial, parentTypeId) {

	var result = [];

	// get the parent by serial and type
	var parent = fullTree.find(item => {
		return ((item.serial == parentSerial) && (item.type_id == parentTypeId));
	});

	result.push(parent);

	// now we can find children by their parent ids
	var findBranch = function (arr, parentId) {
		// get all children with the same parent
		var childArr = arr.filter(item => {
			return (item.parent_id == parentId);
		});

		if (childArr.length > 0) {
			// add children to result
			result = result.concat(childArr);

			// iterate the children and get their children....
			childArr.forEach(child => {
				findBranch(arr, child.id);
			});
		}
	};

	findBranch(fullTree, parent.id);

	return result;
};

NodeTreeUtils.prototype.findParent = function (subTree, childTypeId) {

	return subTree.find(item => {
		return (item.type_id == (childTypeId - 1));
	});
};

NodeTreeUtils.prototype.buildHappnPath = function (incomingNode, subTree) {

	// IBC
	if (incomingNode.type_id == 0)
		return '/0/' + incomingNode.serial;

	var parent;
	var subPath = '/' + incomingNode.type_id + '/' + incomingNode.serial;

	parent = this.findParent(subTree, incomingNode.type_id);

	if (parent != null)
		return parent.happn_path + '/' + incomingNode.type_id + '/' + incomingNode.serial;

	// fallback when no parent can be found
	if (incomingNode.type_id == 1)
		return '/0/*' + subPath;

	if (incomingNode.type_id == 2)
		return '/0/*/1/*' + subPath;
};

NodeTreeUtils.prototype.setSerialByPosition = function (incomingNode, subTree, pos, len) {

	if (subTree == null || subTree.length == 0)
		return;

	if (incomingNode.serial == null) {
		if (incomingNode.type_id == 2) {

			if (subTree[0].window_id == len - 1) {

				var ib651 = subTree.find(c => {
					return (c.type_id == 2 && c.window_id == (pos));
				});

				if (ib651 != null)
					incomingNode.serial = parseInt(ib651.serial);
			}
		}
	}
	//else {
	//    //console.log(node);
	//    for (var x = 1; x < subTree.length; x++) {
	//        if (subTree[x].window_id == incomingNode.window_id) {
	//            incomingNode.serial = parseInt(subTree[x].serial);
	//        }
	//    }
	//}
};


module.exports = NodeTreeUtils;