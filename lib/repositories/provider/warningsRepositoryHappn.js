function WarningsRepository() {}

WarningsRepository.prototype.initialise = function($happn) {
	$happn.log.info("WarningsRepository Initialize.................");

	let init = async () => {
		try {
			$happn.log.info("WarningsRepository Initialize.................PASS");
		} catch (err) {
			$happn.log.error("WarningsRepository Initialize.................FAIL");
			return Promise.reject(err);
		}
	};
	return init();
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
