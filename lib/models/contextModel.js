class ContextModel {
	constructor(nodeArr, branch) {
		this.nodeArr = nodeArr;
		this.updateNodes = [];
		this.newNodes = [];
		this.missingNodes = [];
		this.branch = branch;
		this.logs = [];
	}
}

module.exports = ContextModel;
