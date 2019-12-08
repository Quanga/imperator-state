function WarningsRepository() {}

WarningsRepository.prototype.set = function($happn, warning) {
	const { log } = $happn;
	const { data } = $happn.exchange;

	return new Promise((resolve, reject) => {
		data.set(
			`/warnings/${warning.typeId}/${warning.serial}/${warning.createdAt}`,
			warning,
			{},
			(err, response) => {
				if (err) {
					log.error("cannot write log to path");
					return reject(err);
				}

				resolve(response);
			},
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
				...(typeof to !== "function" && { $lte: to }),
			},
		}),
	};

	return new Promise((resolve, reject) => {
		data.get(
			`/warnings/${path}`,
			{
				criteria: criteria,
				options: options,
			},
			(err, response) => {
				if (err) {
					log.error(`cannot logs * get from path`, err);
					return reject(err);
				}

				resolve(response);
			},
		);
	});
};

WarningsRepository.prototype.getById = function($happn, getId) {
	const { log } = $happn;
	const { data } = $happn.exchange;

	const options = {};
	let criteria = {
		id: { $in: [getId] },
	};

	return new Promise((resolve, reject) => {
		data.get(
			`/warnings/*`,
			{
				criteria: criteria,
				options: options,
			},
			(err, response) => {
				if (err) {
					log.error(`cannot logs * get from path`, err);
					return reject(err);
				}

				resolve(response);
			},
		);
	});
};

WarningsRepository.prototype.delete = function($happn, path) {
	const { log } = $happn;
	const { data } = $happn.exchange;

	return new Promise((resolve, reject) => {
		data.remove(`/warnings/${path}`, null, (err, result) => {
			if (err) {
				log.error(`Cannot Delete Logs`, err);
				return reject(err);
			}

			resolve(result);
		});
	});
};

module.exports = WarningsRepository;
