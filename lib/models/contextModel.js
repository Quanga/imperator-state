class ContextModel {
	constructor(allNodes, branch) {
		this.updateNodes = [];
		this.newNodes = [];
		this.missingNodes = [];
		this.allNodes = allNodes;
		this.branch = branch;
		this.logs = [];
	}
}

module.exports = ContextModel;
