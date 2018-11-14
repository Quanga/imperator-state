class ContextModel {
	constructor(fullTree, subTree) {
		this.updateNodes = [];
		this.newNodes = [];
		this.missingNodes = [];
		this.fullTree = fullTree;
		this.subTree = subTree;
		this.logs = [];
	}
}

module.exports = ContextModel;
