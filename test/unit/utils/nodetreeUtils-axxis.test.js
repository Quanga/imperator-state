var assert = require("assert");

describe("UTILS-nodetreeUtils-Axxis-test", function() {
	var NodeTreeUtils = require("../../../lib/utils/node_tree_utils");
	var nodeTreeUtils = null;

	var treeNodes = [
		{
			data: {
				name: "CCB",
				typeId: 0,
				serial: "123",
				parentType: null,
				parentSerial: null
			}
		},
		{
			data: {
				name: "CBB 1",
				typeId: 3,
				serial: "32",
				parentType: 0,
				parentSerial: "123"
			}
		},
		{
			data: {
				name: "CBB 2",
				typeId: 3,
				serial: "33",
				parentType: 0,
				parentSerial: "123"
			}
		},
		{
			data: {
				name: "EDD 1",
				typeId: 4,
				serial: "811",
				parentType: 3,
				parentSerial: "33"
			}
		},
		{
			data: {
				name: "EDD 2",
				typeId: 4,
				serial: "812",
				parentType: 3,
				parentSerial: "32"
			}
		},
		{
			data: {
				name: "EDD 3",
				typeId: 4,
				serial: "813",
				parentType: 3,
				parentSerial: "32"
			}
		},
		{
			data: {
				name: "EDD 4",
				typeId: 2,
				serial: "814",
				parentType: 3,
				parentSerial: "32"
			}
		},
		{
			data: {
				name: "EDD 5",
				typeId: 2,
				serial: "815",
				parentType: 3,
				parentSerial: "33"
			}
		}
	];

	this.timeout(30000);

	before("it sets up the dependencies", function(callback) {
		nodeTreeUtils = new NodeTreeUtils();
		callback();
	});
});
