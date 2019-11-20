const diff = require("deep-object-diff").diff;
const { ControlUnitModel, SectionControlModel } = require("../models/unitModels");
const { BoosterModel, CBoosterModel, EDDModel, CFCModel } = require("../models/unitModels");

/**
 * @category Utilities
 * @module lib/mappers/DataMapper
 */

/**
 * @class DataMapper
 * @requires models/UnitModels
 */
class DataMapper {
	/**
	 * @summary Get updates betweeen states
	 * @param {UnitModel} nextState
	 * @param {UnitModel} prevState
	 * @returns {Promise<object>} diffs
	 */
	async getUpdates(nextState, prevState) {
		try {
			const diffs = diff(prevState.data, nextState.data);

			const diffNulls = Object.keys(diffs).filter(x => diffs[x] === null);
			const filterOut = ["path", "createdAt", ...diffNulls];

			const result = Object.keys(diffs).reduce((acc, cur) => {
				return filterOut.indexOf(cur) === -1 ? { ...acc, [cur]: diffs[cur] } : acc;
			}, {});

			return Object.keys(result).length > 0 ? result : null;
		} catch (err) {
			return Promise.reject(err);
		}
	}

	/**
	 * @summary Async function that transforms the nodes
	 * stored as JSON and turns them back into their Unit Models
	 * @param {object} getResult
	 */
	async mapToUnits(getResult) {
		try {
			const resultArr = getResult.map(item => {
				let unitObj = null;
				switch (item.data.typeId) {
					case 0:
						unitObj = new ControlUnitModel(item.data.serial);
						break;
					case 1:
						unitObj = new SectionControlModel(item.data.serial);
						break;
					case 2:
						unitObj = new BoosterModel(item.data.serial, null);
						break;
					case 3:
						unitObj = new CBoosterModel(item.data.serial);
						break;
					case 4:
						unitObj = new EDDModel(
							item.data.serial,
							item.data.parentSerial,
							item.data.windowId,
							item.data.delay,
						);
						break;
					case 5:
						unitObj = new CFCModel(item.data.serial, null, null, null);
						break;
				}

				let remappedData = this.mapProps(item.data, unitObj.data);
				let remappedMeta = this.mapProps(item.meta, unitObj.meta);

				unitObj.data = remappedData;
				unitObj.meta = remappedMeta;

				return unitObj;
			});

			return resultArr;
		} catch (err) {
			return Promise.reject(err);
		}
	}

	/**
	 * @summary Map properties from one object to another
	 * @param {*} oldO
	 * @param {*} newO
	 * @returns {promise} newObj
	 */
	mapProps(old, newO) {
		return Object.keys(newO).reduce((acc, cur) => {
			if (Object.prototype.hasOwnProperty.call(old, cur)) {
				return old[cur] !== null ? { ...acc, cur: old[cur] } : acc;
			}
			return acc;
		}, {});
	}
}

module.exports = DataMapper;
