function LogsRepository() {}

LogsRepository.prototype.initialise = function($happn) {
	const { error: logError, info: logInfo } = $happn.log;
	logInfo("LogsRepository Initialize.................");

	let init = async () => {
		try {
			logInfo("LogsRepository Initialize.................PASS");
		} catch (err) {
			logError("LogsRepository Initialize.................FAIL");
			return Promise.reject(err);
		}
	};
	return init();
};

LogsRepository.prototype.insertLog = function($happn, log) {
	const { error: logError } = $happn.log;
	const { data } = $happn.exchange;

	/*
let changedObject = {
						serial: node.data.serial,
						typeId: node.data.typeId,
						modified: node.meta.storedPacketDate,
						changes: node.meta.dirty,
						number: this.emitCount
					};
	*/

	return new Promise((resolve, reject) => {
		data.set(
			`persist/logs/${log.modified}/${log.typeId}/${log.serial}`,
			log,
			{},
			(err, response) => {
				if (err) {
					logError("cannot write log to path");
					return reject(err);
				}

				resolve(response);
			}
		);
	});
};

LogsRepository.prototype.getAll = function($happn) {
	const { error: logError } = $happn.log;
	const { data } = $happn.exchange;

	return new Promise((resolve, reject) => {
		data.get(`persist/logs/*`, null, (err, response) => {
			if (err) {
				logError(`cannot logs * get from path`, err);
				return reject(err);
			}
			resolve(response);
		});
	});
};

LogsRepository.prototype.getLogData = function($happn, nodeSerial, nodeType) {
	const { error: logError } = $happn.log;
	const { data } = $happn.exchange;

	return new Promise((resolve, reject) => {
		data.get(
			`persist/logs/${nodeType}/${nodeSerial}/*`,
			null,
			(err, response) => {
				if (err) {
					logError(
						`cannot logs for ${nodeType}/${nodeSerial}/* get from path`,
						err
					);
					return reject(err);
				}
				resolve(response);
			}
		);
	});
};

LogsRepository.prototype.deleteAll = function($happn) {
	const { info: logInfo, error: logError } = $happn.log;
	const { data } = $happn.exchange;

	return new Promise((resolve, reject) => {
		data.remove("persist/logs/*", null, function(err, result) {
			if (err) {
				logError(`Cannot Delete Logs`, err);
				return reject(err);
			}
			logInfo("All Logs successfully removed");
			resolve(result);
		});
	});
};

module.exports = LogsRepository;