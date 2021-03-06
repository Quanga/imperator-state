function StateService() {}

/**
 * payload: {service: "App", state: "STOPPED", message: null};
 */
StateService.prototype.updateState = function($happn, payload) {
	const { stateService } = $happn.exchange;
	const { error: logError } = $happn.log;

	return (async () => {
		try {
			const currentState = await stateService.getState(payload.service);
			const update = { ...currentState, ...payload };
			stateService.setState(update);
		} catch (err) {
			logError("State update error", err);
		}
	})();
};

StateService.prototype.getState = function($happn, service) {
	const { data } = $happn.exchange;

	return new Promise((resolve, reject) => {
		data.get(`mem/service/${service}`, null, (error, response) => {
			if (error) return reject(error);
			return resolve(response);
		});
	});
};

StateService.prototype.getAllStates = function($happn) {
	const { data } = $happn.exchange;

	return new Promise((resolve, reject) => {
		data.get(`mem/service/*`, null, (error, response) => {
			if (error) return reject(error);
			return resolve(response);
		});
	});
};

StateService.prototype.setState = function($happn, payload) {
	const { data } = $happn.exchange;

	return new Promise((resolve, reject) => {
		data.set(
			`mem/service/${payload.service}`,
			payload,
			{},
			(error, response) => {
				if (error) return reject(error);
				return resolve(response);
			}
		);
	});
};

module.exports = StateService;
