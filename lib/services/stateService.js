function StateService() {}

/**
 * payload: {service: "App", state: "STOPPED", message: null};
 */
StateService.prototype.updateState = function($happn, payload) {
	const { stateService } = $happn.exchange;
	const { log } = $happn;

	return (async () => {
		try {
			const currentState = await stateService.getState(payload.service || payload.repository);

			log.info(`${payload.service || payload.repository} - ${payload.state}`);

			if (payload.hasOwnProperty("error")) {
				log.warn(payload.error.message);
			}
			stateService.setState({ ...currentState, ...payload });
		} catch (err) {
			log.error("State update error", err);
		}
	})();
};

StateService.prototype.getState = function($happn, service) {
	const { data } = $happn.exchange;

	return new Promise((resolve, reject) => {
		data.get(`mem/service/${service}`, null, (error, response) => {
			if (error) return reject(error);

			resolve(response);
		});
	});
};

StateService.prototype.getAllStates = function($happn) {
	const { data } = $happn.exchange;

	return new Promise((resolve, reject) => {
		data.get(`mem/service/*`, null, (error, response) => {
			if (error) return reject(error);

			resolve(response);
		});
	});
};

StateService.prototype.setState = function($happn, payload) {
	const { data } = $happn.exchange;

	return new Promise((resolve, reject) => {
		data.set(`mem/service/${payload.service}`, payload, {}, (error, response) => {
			if (error) return reject(error);

			resolve(response);
		});
	});
};

module.exports = StateService;
