function WarningsRepository() {}

WarningsRepository.prototype.componentStart = function($happn) {
	const { stateService } = $happn.exchange;
	const { name } = $happn;

	return (async () => {
		stateService.updateState({ repository: name, state: "STARTED" });
	})();
};

WarningsRepository.prototype.componentStop = function($happn) {
	const { stateService } = $happn.exchange;
	const { name } = $happn;

	return (async () => {
		stateService.updateState({ repository: name, state: "STOPPED" });
	})();
};

WarningsRepository.prototype.set = function($happn, warning) {
	const { log } = $happn;
	const { data } = $happn.exchange;

	return new Promise((resolve, reject) => {
		data.set(
			`persist/warnings/${warning.typeId}/${warning.serial}/${warning.createdAt}`,
			warning,
			{},
			(err, response) => {
				if (err) {
					log.error("cannot write log to path");
					return reject(err);
				}

				console.log("SETTING WARNING", warning);
				console.log("SETTING WARNING", response);

				resolve(response);
			}
		);
	});
};

WarningsRepository.prototype.get = function($happn, path, from, to) {
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
			`persist/warnings/${path}`,
			{
				criteria: criteria,
				options: options
			},
			(err, response) => {
				if (err) {
					log.error(`cannot logs * get from path`, err);
					return reject(err);
				}

				resolve(response);
			}
		);
	});
};

WarningsRepository.prototype.getById = function($happn, getId) {
	const { log } = $happn;
	const { data } = $happn.exchange;

	const options = {};
	let criteria = {
		id: { $in: [getId] }
	};

	return new Promise((resolve, reject) => {
		data.get(
			`persist/warnings/*`,
			{
				criteria: criteria,
				options: options
			},
			(err, response) => {
				if (err) {
					log.error(`cannot logs * get from path`, err);
					return reject(err);
				}

				resolve(response);
			}
		);
	});
};

WarningsRepository.prototype.delete = function($happn, path) {
	const { log } = $happn;
	const { data } = $happn.exchange;

	return new Promise((resolve, reject) => {
		data.remove(`persist/warnings/${path}`, null, function(err, result) {
			if (err) {
				log.error(`Cannot Delete Logs`, err);
				return reject(err);
			}

			resolve(result);
		});
	});
};

module.exports = WarningsRepository;
