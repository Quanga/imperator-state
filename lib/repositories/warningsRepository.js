class WarningsRepository {
	constructor() {}
	set($happn, warning) {
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
					resolve(response);
				},
			);
		});
	}
	get($happn, path, from, to) {
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
				`persist/warnings/${path}`,
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
	}
	getById($happn, getId) {
		const { log } = $happn;
		const { data } = $happn.exchange;
		const options = {};
		let criteria = {
			id: { $in: [getId] },
		};
		return new Promise((resolve, reject) => {
			data.get(
				`persist/warnings/*`,
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
	}
	delete($happn, path) {
		const { log } = $happn;
		const { data } = $happn.exchange;
		return new Promise((resolve, reject) => {
			data.remove(`persist/warnings/${path}`, null, (err, result) => {
				if (err) {
					log.error(`Cannot Delete Logs`, err);
					return reject(err);
				}
				resolve(result);
			});
		});
	}
}

module.exports = WarningsRepository;
