/* eslint-disable no-unused-vars */

const defaultUI = require("../constants/recipes");

/**
 * @category Services
 * @class uiService
 * @summary Service to handle API actions for UI recipes.
 */
class uiService {
	constructor() {}
	//#region Standard UI API
	async start($happn) {
		const { uiService } = $happn.exchange;
		const { log } = $happn;

		try {
			let recipe = await uiService.get();
			if (!recipe) await uiService.set(defaultUI());
		} catch (error) {
			log.error(error);
		}
	}

	/**
	 * @summary GET the UI recipe for standard Dashboard
	 * @param {$happn} $happn
	 * @returns {object} UI recipe Object
	 */
	get($happn) {
		const { data } = $happn.exchange;
		return new Promise((resolve, reject) => {
			data.get("persist/ui", null, (error, response) => {
				if (error) return reject(error);
				resolve(response);
			});
		});
	}

	/**
	 * @summary SET the UI recipe for standard Dashboard
	 * @param {$happn} DI $happn Dependancy Injection
	 * @param {object} payload $happn Dependancy Injection
	 * @returns {object} UI recipe Object
	 */
	set($happn, payload) {
		const { data } = $happn.exchange;
		return new Promise((resolve, reject) => {
			data.set("persist/ui", payload, {}, (error, response) => {
				if (error) return reject(error);
				return resolve(response);
			});
		});
	}
	/**
	 * @summary DELETE the UI recipe for standard Dashboard
	 * @param {$happn} DI $happn Dependancy Injection
	 * @param {string} path the path to delete from
	 * @returns {object} UI recipe Object
	 */
	delete($happn, path) {
		const { data } = $happn.exchange;
		return new Promise((resolve, reject) => {
			data.remove(`persist/ui/${path}`, (err, resp) => {
				if (err) return reject(err);
				resolve(resp);
			});
		});
	}

	//#endregion
	//#region AXXIS UI API
	/**
	 * @summary GET the AXXXIS UI recipe for standard Dashboard
	 * @param {$happn} DI $happn Dependancy Injection
	 * @returns {object} UI recipe Object
	 */
	async getAxxisDash($happn) {
		const { data } = $happn.exchange;

		let result = await new Promise((resolve, reject) => {
			data.get("persist/ui/recipe", null, (err, resp) => {
				if (err) return reject(err);
				resolve(resp);
			});
		});
		return result ? result : { units: {} };
	}

	/**
	 * @summary SET the AXXXIS UI recipe for standard Dashboard
	 * @param {$happn} DI $happn Dependancy Injection
	 * @param {unitCoordinateObj} payload unit coordinate object
	 * @returns {object} UI recipe Object
	 */
	async setAxxisDash($happn, payload) {
		const { data, uiService } = $happn.exchange;

		let uiObj = await uiService.getAxxisDash();
		const updated = { units: { ...uiObj.units, [payload.id]: { x: payload.x, y: payload.y } } };
		let result = await new Promise((resolve, reject) => {
			data.set("persist/ui/recipe", updated, {}, (error, response) => {
				if (error) return reject(error);
				return resolve(response);
			});
		});
		return result;
	}

	async deleteAxxisDash($happn, unit) {
		const { data, uiService } = $happn.exchange;

		let uiObj = await uiService.getAxxisDash();
		if (Object.prototype.hasOwnProperty.call(uiObj.units, unit.id)) delete uiObj.units[unit.id];
		const result = await new Promise((resolve, reject) => {
			data.set("persist/ui/recipe", uiObj, {}, (error, response) => {
				if (error) return reject(error);
				return resolve(response);
			});
		});
		return result;
	}
}

//#endregion

module.exports = uiService;

/**
 * @summary Dependancy Injection of the Happner Framework
 * @typedef unitCoordinateObj
 * @type {object}
 * @property {string} id - unit ID
 * @property {number} x - screen x coordinate
 * @property {number} y - screen y coordinate
 * @memberof uiService#
 */
