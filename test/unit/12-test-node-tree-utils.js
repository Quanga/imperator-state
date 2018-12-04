var assert = require("assert");

describe("node-tree-utils-test", function() {
	var NodeTreeUtils = require("../../lib/utils/node_tree_utils");
	var nodeTreeUtils = null;

	var treeNodes = [
		{
			data: {
				name: "IBC",
				type_id: 0,
				id: 1,
				serial: "123"
			}
		},
		{
			data: {
				name: "ISC-5",
				type_id: 1,
				id: 10,
				parent_id: 1,
				serial: "32"
			}
		},
		{
			data: {
				name: "ISC-7",
				type_id: 1,
				id: 13,
				parent_id: 1,
				serial: "33"
			}
		},
		{
			data: {
				name: "IB651-1",
				type_id: 2,
				id: 101,
				parent_id: 10,
				serial: "811"
			}
		},
		{
			data: {
				name: "IB651-2",
				type_id: 2,
				id: 102,
				parent_id: 10,
				serial: "812"
			}
		},
		{
			data: {
				name: "IB651-3",
				type_id: 2,
				id: 103,
				parent_id: 10,
				serial: "813"
			}
		},
		{
			data: {
				name: "IB651-4",
				type_id: 2,
				id: 104,
				parent_id: 13,
				serial: "814"
			}
		},
		{
			data: {
				name: "IB651-5",
				type_id: 2,
				id: 105,
				parent_id: 13,
				serial: "815"
			}
		}
	];

	this.timeout(30000);

	before("it sets up the dependencies", function(callback) {
		nodeTreeUtils = new NodeTreeUtils();
		callback();
	});

	it("successfully finds sub-tree AXXIS", async function() {
		var expected = [
			{
				data: {
					name: "ISC-5",
					type_id: 1,
					id: 10,
					parent_id: 1,
					serial: "32"
				}
			},
			{
				data: {
					name: "IB651-1",
					type_id: 2,
					id: 101,
					parent_id: 10,
					serial: "811"
				}
			},
			{
				data: {
					name: "IB651-2",
					type_id: 2,
					id: 102,
					parent_id: 10,
					serial: "812"
				}
			},
			{
				data: {
					name: "IB651-3",
					type_id: 2,
					id: 103,
					parent_id: 10,
					serial: "813"
				}
			}
		];

		let test = async () => {
			try {
				let result = await nodeTreeUtils.findBranch(treeNodes, 32, 1);
				assert.deepEqual(result, expected);
			} catch (err) {
				return Promise.reject(err);
			}
		};
		return test();
	});

	it("successfully finds  a sub-tree2", async function() {
		var expected = [];

		let test = async () => {
			try {
				let result = await nodeTreeUtils.findBranch(treeNodes, 1, 0);
				assert.deepEqual(result, expected);
			} catch (err) {
				return Promise.reject(err);
			}
		};
		return test();
	});

	it("successfully finds IB651 parent", async function() {
		var expected = {
			data: {
				name: "ISC-7",
				type_id: 1,
				id: 13,
				parent_id: 1,
				serial: "33"
			}
		};

		let test = async () => {
			try {
				let subTree = await nodeTreeUtils.findBranch(treeNodes, 33, 1);
				let result = await nodeTreeUtils.findParent(subTree, 2);
				//console.log(subTree);
				assert.deepEqual(result, expected);

				//var result = nodeTreeUtils.findParent(subTree, 2);
			} catch (err) {
				return Promise.reject(err);
			}
		};
		return test();
	});

	it("successfully finds ISC parent", async function() {
		var expected = {
			data: {
				name: "IBC",
				type_id: 0,
				id: 1,
				serial: "123"
			}
		};

		let test = async () => {
			try {
				var result = nodeTreeUtils.findParent(treeNodes, 1);

				assert.deepEqual(result, expected);
			} catch (err) {
				return Promise.reject(err);
			}
		};

		return test();
	});
});
