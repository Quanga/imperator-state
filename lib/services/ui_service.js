/* eslint-disable no-unused-vars */

const defaultUI = require("../constants/recipes");
const { DeviceTypes } = require("../constants/defaultAppConstants");

/**
 * @category UI Service
 * @module lib/services/uiService
 */

/**
 * @category UI Service
 * @summary Service to handle API actions for UI recipes.
 * @memberof module:lib/services/uiService
 */
function uiService() {}

//#region Standard UI API

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

/**
 * @summary get the UI recipe for standard Dashboard
 * @param {$happn} DI $happn Dependancy Injection
 * @returns {object} UI recipe Object
 */
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

uiService.prototype.delete = function($happn, path) {
	const { data } = $happn.exchange;

	return new Promise((resolve, reject) => {
		data.remove(`persist/ui/${path}`, (err, resp) => {
			if (err) return reject(err);

			resolve(resp);
		});
	});
};
//#endregion

//#region AXXIS UI API

uiService.prototype.getAxxisDash = function($happn) {
	const { data } = $happn.exchange;

	return (async () => {
		let result = await new Promise((resolve, reject) => {
			data.get("persist/ui/recipe", null, (err, resp) => {
				if (err) return reject(err);
				resolve(resp);
			});
		});

		return result ? result : { units: {} };
	})();
};

uiService.prototype.setAxxisDash = function($happn, payload) {
	const { data, uiService } = $happn.exchange;

	return (async () => {
		let uiObj = await uiService.getAxxisDash();

		const updated = { units: { ...uiObj.units, [payload.id]: { x: payload.x, y: payload.y } } };

		let result = await new Promise((resolve, reject) => {
			data.set("persist/ui/recipe", updated, {}, (error, response) => {
				if (error) return reject(error);

				return resolve(response);
			});
		});

		return result;
	})();
};

uiService.prototype.deleteAxxisDash = function($happn, unit) {
	const { data, uiService } = $happn.exchange;

	return (async () => {
		let uiObj = await uiService.getAxxisDash();
		if (Object.prototype.hasOwnProperty.call(uiObj.units, unit.id)) delete uiObj.units[unit.id];

		const result = await new Promise((resolve, reject) => {
			data.set("persist/ui/recipe", uiObj, {}, (error, response) => {
				if (error) return reject(error);

				return resolve(response);
			});
		});

		return result;
	})();
};
//#endregion

module.exports = uiService;
