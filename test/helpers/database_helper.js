/**
 * Created by grant on 2016/11/29.
 */

function DatabaseHelper() {

	var MockHappn = require('../mocks/mock_happn');
	this.__mockHappn = new MockHappn();

	var NodeRepository = require('../../lib/repositories/node_repository');
	this.__nodeRepository = new NodeRepository();

	this.__nodeRepository.initialise(this.__mockHappn, function (err) {
		if (err)
			console.log('### DATABASEHELPER INITIALISE ERROR!: ' + err);
	});
}

DatabaseHelper.prototype.clearDatabase = function () {

	var self = this;

	return new Promise(function (resolve, reject) {

		console.log(':: CLEARING DATABASE....');

		self.__nodeRepository.deleteNodeData(self.__mockHappn, function (err) {
			if (err)
				return reject(err);

			resolve();
		});
	});
};

DatabaseHelper.prototype.getNodeData = function () {

	var self = this;

	return new Promise(function (resolve, reject) {
		self.__nodeRepository.getNodeData(self.__mockHappn, function (err, result) {
			if (err)
				return reject(err);

			resolve(result);
		});
	});
};

DatabaseHelper.prototype.getNodeTreeData = function (serial, typeId) {

	var self = this;

	return new Promise(function (resolve, reject) {
		self.__nodeRepository.findNodeTreeData(self.__mockHappn, serial, typeId, function (err, result) {
			if (err)
				return reject(err);

			resolve(result);
		});
	});

};

DatabaseHelper.prototype.getLogData = function (nodeSerial) {

	var self = this;

	return new Promise(function (resolve, reject) {
		self.__nodeRepository.getLogData(self.__mockHappn, nodeSerial, function (err, result) {
			if (err)
				return reject(err);

			resolve(result);
		});
	});
};

module.exports = DatabaseHelper;