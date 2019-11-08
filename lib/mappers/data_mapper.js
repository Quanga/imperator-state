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
	 * @param {*} nextState
	 * @param {*} prevState
	 * @returns {Promise} diffs
	 */
	async getUpdates(nextState, prevState) {
		try {
			const diffs = diff(prevState.data, nextState.data);

			const diffNulls = Object.keys(diffs).filter(x => diffs[x] === null);

			const filterOut = ["path", "createdAt", ...diffNulls];

			for (let index = 0; index < filterOut.length; index++) {
				const element = filterOut[index];
				delete diffs[element];
			}

			if (Object.keys(diffs).length > 0) {
				return diffs;
			}
			return null;
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
			let resultArr = [];

			if (!Array.isArray(getResult)) {
				getResult = [getResult];
			}

			for (const item of getResult) {
				let unitObj = null;
				switch (item.typeId) {
				case 0:
					unitObj = new ControlUnitModel(item.serial);
					break;
				case 1:
					unitObj = new SectionControlModel(item.serial);
					break;
				case 2:
					unitObj = new BoosterModel(item.serial, null);
					break;
				case 3:
					unitObj = new CBoosterModel(item.serial);
					break;
				case 4:
					unitObj = new EDDModel(item.serial, null, null, null);
					break;
				case 5:
					unitObj = new CFCModel(item.serial, null, null, null);
					break;
				}

				let remappedObj = await this.mapProps(item, unitObj);

				resultArr.push(remappedObj);
			}
			return resultArr;
		} catch (err) {
			return Promise.reject(err);
		}
	}

	/**
	 * @summary Map properties from one object to another
	 * @param {*} foundNode
	 * @param {*} newObj
	 * @returns {promise} newObj
	 */
	async mapProps(foundNode, newObj) {
		const { data: newObjData } = newObj;
		try {
			for (let key in newObjData) {
				if (foundNode.hasOwnProperty(key)) {
					let propResult = foundNode[key];
					if (propResult !== null) {
						newObjData[key] = foundNode[key];
					}
				}
			}
			return newObj;
		} catch (err) {
			return Promise.reject(err);
		}
	}
}

module.exports = DataMapper;
