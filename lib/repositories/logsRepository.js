/* eslint-disable no-mixed-spaces-and-tabs */
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

LogsRepository.prototype.set = function($happn, log) {
	const { error: logError } = $happn.log;
	const { data } = $happn.exchange;

	return new Promise((resolve, reject) => {
		data.set(
			`persist/logs/${log.createdAt}/${log.logType}/${log.typeId}/${log.serial}`,
			log,
			{},
			(err, response) => {
				if (err) {
					logError("cannot write log to path");
					return reject(err);
				}
				//console.log(response);

				resolve(response);
			}
		);
	});
};

LogsRepository.prototype.get = function($happn, path, from, to) {
	const { log } = $happn;
	const { data } = $happn.exchange;

	const options = {};
	let criteria = {
		...(typeof from !== "function" && {
			createdAt: {
				...(typeof from !== "function" && { $gte: from }),
				...(typeof to !== "function" && { $lte: to })
			}
		})
	};

	return new Promise((resolve, reject) => {
		data.get(
			`persist/logs/${path}`,
			{
				criteria: criteria,
				options: options
			},
			(err, response) => {
				if (err) {
					log.error(`cannot logs * get from path`, err);
					return reject(err);
				}
				//console.log(response);
				resolve(response);
			}
		);
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

LogsRepository.prototype.delete = function($happn, path) {
	const { info: logInfo, error: logError } = $happn.log;
	const { data } = $happn.exchange;

	return new Promise((resolve, reject) => {
		data.remove(`persist/logs/${path}`, null, function(err, result) {
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
