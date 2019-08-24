/* eslint-disable no-unused-vars */

const defaultUI = require("../constants/recipes");
const { DeviceTypes } = require("../constants/defaultAppConstants");

function uiService() {}

uiService.prototype.start = function($happn) {
	const { uiService, stateService } = $happn.exchange;
	const { name } = $happn;

	return (async () => {
		try {
			let recipe = await uiService.get();
			if (!recipe) await uiService.set(defaultUI());

			stateService.updateState({ service: name, state: "STARTED" });
		} catch (error) {
			stateService.updateState({ service: name, state: "FAILED", error });
		}
	})();
};

uiService.prototype.stop = function($happn) {
	const { stateService } = $happn.exchange;
	const { name } = $happn;

	return new Promise((resolve, reject) => {
		stateService.updateState({ service: name, state: "STOPPED" });
		resolve();
	});
};

uiService.prototype.get = function($happn) {
	const { data } = $happn.exchange;

	return new Promise((resolve, reject) => {
		data.get("persist/ui", null, (error, response) => {
			if (error) return reject(error);
			resolve(response);
		});
	});
};

uiService.prototype.set = function($happn, payload) {
	const { data } = $happn.exchange;

	return new Promise((resolve, reject) => {
		data.set("persist/ui", payload, {}, (error, response) => {
			if (error) return reject(error);

			return resolve(response);
		});
	});
};

uiService.prototype.getDeviceTypes = function($happn) {
	return new Promise((resolve, reject) => {
		resolve(DeviceTypes());
	});
};

uiService.prototype.deleteAll = function($happn) {
	const { data } = $happn.exchange;

	return new Promise((resolve, reject) => {
		data.remove("persist/ui", (err, resp) => {
			if (err) return reject(err);

			resolve(resp);
		});
	});
};

module.exports = uiService;
