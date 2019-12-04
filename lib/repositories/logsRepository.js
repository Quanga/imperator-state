/* eslint-disable no-unused-vars */
/* eslint-disable no-mixed-spaces-and-tabs */
function LogsRepository() {}

LogsRepository.prototype.set = function($happn, logObj) {
	const { log } = $happn;
	const { data } = $happn.exchange;

	return new Promise((resolve, reject) => {
		data.set(
			`persist/logs/${logObj.meta.logType}/${logObj.meta.createdAt}/${logObj.meta.typeId}/${logObj.meta.serial}`,
			logObj,
			{},
			(err, response) => {
				if (err) {
					log.error("cannot write log to path");
					return reject(err);
				}
				console.log(response);
				resolve(response);
			},
		);
	});
};

LogsRepository.prototype.setPacketLog = function($happn, errPacketLog) {
	const { error: logError } = $happn.log;
	const { data } = $happn.exchange;

	return new Promise((resolve, reject) => {
		data.set(`persist/packetLog/${errPacketLog.createdAt}/`, errPacketLog, {}, (err, response) => {
			if (err) {
				logError("cannot write log to path");
				return reject(err);
			}

			resolve(response);
		});
	});
};

LogsRepository.prototype.getPacketLog = function($happn, path, from, to) {
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
			`persist/packetLog/${path}`,
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

LogsRepository.prototype.get = function($happn, path, from, to) {
	const { log } = $happn;
	const { data } = $happn.exchange;

	const options = {
		fields: {
			meta: 1,
			data: 1,
		},
		sort: { "meta.createdAt": 1 },
	};

	let criteria = {
		...(typeof from !== "function" &&
			from !== null &&
			from !== undefined && {
				createdAt: {
					...(typeof from !== "function" && { $gte: from }),
					...(typeof to !== "function" && { $lte: to }),
				},
				logType: { $nin: ["DET_UPDATE", "DET_INSERT"] },
			}),
	};

	return new Promise((resolve, reject) => {
		data.get(
			`persist/logs/${path}`,
			{
				criteria: criteria,
				options: options,
			},
			(err, response) => {
				if (err) {
					log.error(`cannot logs * get from path`, err);
					return reject(err);
				}

				const cleanResponse = response.map(x => {
					return { ...x, _meta: undefined };
				});

				resolve(cleanResponse);
			},
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
