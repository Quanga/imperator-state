/**
 * Created by grant on 2016/11/29.
 */

function DatabaseHelper() {
	var MockHappn = require("../mocks/mock_happn");
	this.__mockHappn = new MockHappn();

	var NodeRepository = require("../../lib/repositories/node_repository");
	this.__nodeRepository = new NodeRepository();

	try {
		this.__nodeRepository
			.initialise(this.__mockHappn)
			.then(console.log("### DATABASEHELPER INITIALISE PASS!"));
	} catch (err) {
		console.log("### DATABASEHELPER INITIALISE ERROR!: " + err);
	}
}

DatabaseHelper.prototype.clearDatabase = function() {
	var self = this;

	return new Promise(function(resolve, reject) {
		console.log(":: CLEARING DATABASE....");

		self.__nodeRepository
			.deleteNodeData(self.__mockHappn)
			.then(() => {
				resolve();
			})
			.catch(err => {
				reject(err);
			});
	});
};

DatabaseHelper.prototype.getNodeData = function() {
	var self = this;

	return new Promise(function(resolve, reject) {
		self.__nodeRepository
			.getNodeData(self.__mockHappn)
			.then(result => resolve(result))
			.catch(err => {
				reject(err);
			});
	});
};

DatabaseHelper.prototype.getNodeTreeData = function(serial, typeId) {
	var self = this;

	return new Promise(function(resolve, reject) {
		self.__nodeRepository
			.findNodeTreeData(self.__mockHappn, serial, typeId)
			.then(result => resolve(result))
			.catch(err => {
				console.log("err" + err);
				reject(err);
			});
	});
};

DatabaseHelper.prototype.getLogData = function(nodeSerial) {
	var self = this;

	return new Promise(function(resolve, reject) {
		self.__nodeRepository.getLogData(self.__mockHappn, nodeSerial, function(
			err,
			result
		) {
			if (err) return reject(err);

			resolve(result);
		});
	});
};

module.exports = DatabaseHelper;
