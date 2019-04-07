var assert = require("assert");

describe("node-tree-utils-test", function() {
	var NodeTreeUtils = require("../../../lib/utils/node_tree_utils");
	var nodeTreeUtils = null;

	var treeNodes = [
		{
			data: {
				name: "IBC",
				typeId: 0,
				serial: "123",
				parentType: null,
				parentSerial: null
			}
		},
		{
			data: {
				name: "ISC-5",
				typeId: 1,
				serial: "32",
				parentType: 0,
				parentSerial: "123"
			}
		},
		{
			data: {
				name: "ISC-7",
				typeId: 1,
				serial: "33",
				parentType: 0,
				parentSerial: "123"
			}
		},
		{
			data: {
				name: "IB651-1",
				typeId: 2,
				serial: "811",
				parentType: 1,
				parentSerial: "32"
			}
		},
		{
			data: {
				name: "IB651-2",
				typeId: 2,
				serial: "812",
				parentType: 1,
				parentSerial: "32"
			}
		},
		{
			data: {
				name: "IB651-3",
				typeId: 2,
				serial: "813",
				parentType: 1,
				parentSerial: "32"
			}
		},
		{
			data: {
				name: "IB651-4",
				typeId: 2,
				serial: "814",
				parentType: 1,
				parentSerial: "33"
			}
		},
		{
			data: {
				name: "IB651-5",
				typeId: 2,
				serial: "815",
				parentType: 1,
				parentSerial: "33"
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
					typeId: 1,
					serial: "32",
					parentType: 0,
					parentSerial: "123"
				}
			},
			{
				data: {
					name: "IB651-1",
					typeId: 2,
					serial: "811",
					parentType: 1,
					parentSerial: "32"
				}
			},
			{
				data: {
					name: "IB651-2",
					typeId: 2,
					serial: "812",
					parentType: 1,
					parentSerial: "32"
				}
			},
			{
				data: {
					name: "IB651-3",
					typeId: 2,
					serial: "813",
					parentType: 1,
					parentSerial: "32"
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
				typeId: 1,
				serial: "33",
				parentType: 0,
				parentSerial: "123"
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
				typeId: 0,
				serial: "123",
				parentType: null,
				parentSerial: null
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
