var fs = require('fs'),
    path = require('path'),
    assert = require('assert');

describe("node-tree-utils-test", function () {

    var NodeTreeUtils = require('../../lib/utils/node_tree_utils');
    var nodeTreeUtils = null;

    var treeNodes = [
        {name: 'IBC', type_id: 0, id: 1, serial: '123'},
        {name: 'ISC-5', type_id: 1, id: 10, parent_id: 1, serial: '32'},
        {name: 'ISC-7', type_id: 1, id: 13, parent_id: 1, serial: '33'},
        {name: 'IB651-1', type_id: 2, id: 101, parent_id: 10, serial: '811'},
        {name: 'IB651-2', type_id: 2, id: 102, parent_id: 10, serial: '812'},
        {name: 'IB651-3', type_id: 2, id: 103, parent_id: 10, serial: '813'},
        {name: 'IB651-4', type_id: 2, id: 104, parent_id: 13, serial: '814'},
        {name: 'IB651-5', type_id: 2, id: 105, parent_id: 13, serial: '815'}
    ];

    this.timeout(30000);

    before('it sets up the dependencies', function (callback) {

        nodeTreeUtils = new NodeTreeUtils();
        callback();
    });

    it('successfully finds sub-tree', function (callback) {

        var expected = [
            {name: 'ISC-5', type_id: 1, id: 10, parent_id: 1, serial: '32'},
            {name: 'IB651-1', type_id: 2, id: 101, parent_id: 10, serial: '811'},
            {name: 'IB651-2', type_id: 2, id: 102, parent_id: 10, serial: '812'},
            {name: 'IB651-3', type_id: 2, id: 103, parent_id: 10, serial: '813'}
        ];

        try {
            var result = nodeTreeUtils.findSubTree(treeNodes, 32, 1);

            assert.deepEqual(result, expected);

            callback();

        } catch (err) {
            callback(err);
        }
    });

    it('successfully finds IB651 parent', function (callback) {

        var expected = {name: 'ISC-7', type_id: 1, id: 13, parent_id: 1, serial: '33'};

        try {
            var subTree = nodeTreeUtils.findSubTree(treeNodes, 33, 1);

            console.log(subTree);

            var result = nodeTreeUtils.findParent(subTree, 2);

            assert.deepEqual(result, expected);

            callback();

        } catch (err) {
            callback(err);
        }
    });

    it('successfully finds ISC parent', function (callback) {

        var expected = {name: 'IBC', type_id: 0, id: 1, serial: '123'};

        try {
            var result = nodeTreeUtils.findParent(treeNodes, 1);

            assert.deepEqual(result, expected);

            callback();

        } catch (err) {
            callback(err);
        }
    });
});