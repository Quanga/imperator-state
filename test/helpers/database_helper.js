
function DatabaseHelper() {
	const MockHappn = require("../mocks/mock_happn");
	this.__mockHappn = new MockHappn();

	const DbConnectionService = require("../../lib/services/db_connection_service");
	this.__dbConnectionService = new DbConnectionService();

	const NodeRepository = require("../../lib/repositories/node_repository");
	this.__nodeRepository = new NodeRepository();

	const LogsRepository = require("../../lib/repositories/logs_repository");
	this.__logsRepository = new LogsRepository();

	const WarningsRepository = require("../../lib/repositories/warnings_repository");
	this.__warningsRepository = new WarningsRepository();
}

DatabaseHelper.prototype.initialise = function () {
	let processAsync = async () => {
		this.__mockHappn.dbInst = this.__dbConnectionService;
		//console.log(this.__mockHappn.config);
		try {
			await this.__dbConnectionService.initialise(this.__mockHappn);
			console.log("### __DB INITIALISE PASS!");

			await this.__nodeRepository.initialise(this.__mockHappn);
			await this.__logsRepository.initialise(this.__mockHappn);
			await this.__warningsRepository.initialise(this.__mockHappn);
			console.log("### DATABASEHELPER INITIALISE PASS!");
		} catch (err) {
			console.log("### DATABASEHELPER INITIALISE ERROR!: " + err);
			return Promise.reject(err);
		}
	};

	return processAsync();
};

DatabaseHelper.prototype.clearDatabase = function () {
	let clearDatabaseAsync = async () => {
		console.log(":: CLEARING DATABASE....");
		try {
			await this.__nodeRepository.deleteAll(this.__mockHappn);
			console.log("cleared");
			await this.__logsRepository.deleteAll(this.__mockHappn);
			await this.__warningsRepository.deleteAll(this.__mockHappn);
		} catch (err) {
			return Promise.reject(err);
		}
	};
	return clearDatabaseAsync();
};

DatabaseHelper.prototype.getNodeData = function () {
	return new Promise((resolve, reject) => {
		this.__nodeRepository
			.getNodeData(this.__mockHappn)
			.then(result => resolve(result))
			.catch(err => {
				reject(err);
			});
	});
};

DatabaseHelper.prototype.getNodeTreeData = function (serial, typeId) {
	return new Promise((resolve, reject) => {
		this.__nodeRepository
			.findNodeTreeData(this.__mockHappn, serial, typeId)
			.then(result => resolve(result))
			.catch(err => {
				reject(err);
			});
	});
};

DatabaseHelper.prototype.getLogData = function (nodeSerial) {
	return new Promise((resolve, reject) => {
		this.__nodeRepository.getLogData(
			this.__mockHappn,
			nodeSerial,
			(err, result) => {
				if (err) {
					return reject(err);
				}

				resolve(result);
			}
		);
	});
};

module.exports = DatabaseHelper;
