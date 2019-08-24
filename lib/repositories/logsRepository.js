function LogsRepository() {}

LogsRepository.prototype.componentStart = function($happn) {
	const { stateService } = $happn.exchange;
	const { name } = $happn;

	return (async () => {
		stateService.updateState({ repository: name, state: "STARTED" });
	})();
};

LogsRepository.prototype.componentStop = function($happn) {
	const { stateService } = $happn.exchange;
	const { name } = $happn;

	return (async () => {
		stateService.updateState({ repository: name, state: "STOPPED" });
	})();
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
	//console.log("INCOMING LOG", log);
	return new Promise((resolve, reject) => {
		data.set(
			`persist/logs/${log.modified}/${log.logType}/${log.typeId}/${log.windowId || log.serial}`,
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
		data.get(`persist/logs/${nodeType}/${nodeSerial}/*`, null, (err, response) => {
			if (err) {
				logError(`cannot logs for ${nodeType}/${nodeSerial}/* get from path`, err);
				return reject(err);
			}
			resolve(response);
		});
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
