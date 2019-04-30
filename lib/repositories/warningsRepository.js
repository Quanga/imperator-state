function WarningsRepository() {}

WarningsRepository.prototype.start = function($happn) {
	const { info: logInfo } = $happn.log;

	let initAsync = async () => {
		logInfo("Happn WarningsRepository Initialize.................PASS");
	};
	return initAsync();
};

WarningsRepository.prototype.stop = function($happn) {
	const { info: logInfo } = $happn.log;

	let stopAsync = async () => {
		logInfo("Happn WarningsRepository Initialize.................PASS");
	};
	return stopAsync();
};

WarningsRepository.prototype.insert = function($happn, warning) {
	const { error: logError } = $happn.log;
	const { data } = $happn.exchange;

	let warningObj = {
		message: warning.message
	};

	return new Promise((resolve, reject) => {
		data.set(
			`persist/warnings/${Date.now()}`,
			warningObj,
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

WarningsRepository.prototype.getAll = function($happn) {
	const { error: logError } = $happn.log;
	const { data } = $happn.exchange;

	return new Promise((resolve, reject) => {
		data.get(`persist/warnings/*`, null, (err, response) => {
			if (err) {
				logError(`cannot logs * get from path`, err);
				return reject(err);
			}
			resolve(response);
		});
	});
};

WarningsRepository.prototype.getWarningsData = function(
	$happn,
	nodeSerial,
	nodeType
) {
	const { error: logError } = $happn.log;
	const { data } = $happn.exchange;

	return new Promise((resolve, reject) => {
		data.get(
			`persist/warnings/${nodeType}/${nodeSerial}`,
			null,
			(err, response) => {
				if (err) {
					logError(`cannot logs * get from path`, err);
					return reject(err);
				}
				resolve(response);
			}
		);
	});
};

WarningsRepository.prototype.deleteAll = function($happn) {
	const { info: logInfo, error: logError } = $happn.log;
	const { data } = $happn.exchange;

	return new Promise((resolve, reject) => {
		data.remove("persist/warnings/*", null, function(err, result) {
			if (err) {
				logError(`Cannot Delete Warnings`, err);
				return reject(err);
			}
			logInfo("All Warnings successfully removed");
			resolve(result);
		});
	});
};

module.exports = WarningsRepository;
