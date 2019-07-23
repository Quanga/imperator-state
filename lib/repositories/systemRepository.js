function SystemRepository() {}

SystemRepository.prototype.get = function($happn, path, options = null) {
	const { error: logError } = $happn.log;
	const { data } = $happn.exchange;

	return new Promise(resolve => {
		data.get(`persist/system/${path}`, options, (err, response) => {
			if (err) {
				return logError("Failed to get system", err);
			}

			resolve(response);
		});
	});
};

SystemRepository.prototype.set = function($happn, path, msgObj) {
	const { error: logError } = $happn.log;
	const { data } = $happn.exchange;

	return new Promise(resolve => {
		data.set(`persist/system/${path}`, msgObj, {}, (err, resp) => {
			if (err) {
				return logError("cannot write packet to path", err);
			}

			resolve(resp);
		});
	});
};

SystemRepository.prototype.delete = function($happn, path) {
	const { error: logError } = $happn.log;
	const { data } = $happn.exchange;

	return new Promise(resolve => {
		data.remove(`persist/system/${path}`, null, (err, result) => {
			if (err) {
				return logError(`Cannot Delete system`, err);
			}
			resolve(result);
		});
	});
};

module.exports = SystemRepository;
