var assert = require("assert");

describe("node-tree-utils-Axxis-test", function() {
	var NodeTreeUtils = require("../../lib/utils/node_tree_utils");
	var nodeTreeUtils = null;

	var treeNodes = [
		{
			name: "CCB",
			type_id: 0,
			id: 1,
			serial: "123"
		},
		{
			name: "CBB 1",
			type_id: 3,
			id: 10,
			parent_id: 1,
			serial: "32"
		},
		{
			name: "CBB 2",
			type_id: 3,
			id: 13,
			parent_id: 1,
			serial: "33"
		},
		{
			name: "EDD 1",
			type_id: 4,
			id: 101,
			parent_id: 10,
			serial: "811"
		},
		{
			name: "EDD 2",
			type_id: 4,
			id: 102,
			parent_id: 10,
			serial: "812"
		},
		{
			name: "EDD 3",
			type_id: 4,
			id: 103,
			parent_id: 10,
			serial: "813"
		},
		{
			name: "EDD 4",
			type_id: 2,
			id: 104,
			parent_id: 13,
			serial: "814"
		},
		{
			name: "EDD 5",
			type_id: 2,
			id: 105,
			parent_id: 13,
			serial: "815"
		}
	];

	this.timeout(30000);

	before("it sets up the dependencies", function(callback) {
		nodeTreeUtils = new NodeTreeUtils();
		callback();
	});

	it("successfully finds sub-tree", function(callback) {
		var expected = [
			{
				name: "CBB 1",
				type_id: 3,
				id: 10,
				parent_id: 1,
				serial: "32"
			},
			{
				name: "EDD 1",
				type_id: 4,
				id: 101,
				parent_id: 10,
				serial: "811"
			},
			{
				name: "EDD 2",
				type_id: 4,
				id: 102,
				parent_id: 10,
				serial: "812"
			},
			{
				name: "EDD 3",
				type_id: 4,
				id: 103,
				parent_id: 10,
				serial: "813"
			}
		];

		try {
			nodeTreeUtils.findSubTree(treeNodes, 32, 3).then(result => {
				assert.deepEqual(result, expected);

				callback();
			});
		} catch (err) {
			callback(err);
		}
	});

	it("successfully finds EDD parent", function(callback) {
		var expected = {
			name: "CBB 2",
			type_id: 3,
			id: 13,
			parent_id: 1,
			serial: "33"
		};

		try {
			nodeTreeUtils
				.findSubTree(treeNodes, 33, 3)
				.then(subTree => {
					nodeTreeUtils.findParent(subTree, 2);
					console.log(subTree);
				})
				.then(result => {
					assert.deepEqual(result, expected);
				});

			//var result = nodeTreeUtils.findParent(subTree, 2);

			//assert.deepEqual(result, expected);

			callback();
		} catch (err) {
			callback(err);
		}
	});

	it("successfully finds CBB parent", function(callback) {
		var expected = {
			name: "CCB",
			type_id: 0,
			id: 1,
			serial: "123"
		};

		try {
			var result = nodeTreeUtils.findParent(treeNodes, 1);

			assert.deepEqual(result, expected);

			callback();
		} catch (err) {
			callback(err);
		}
	});
});
