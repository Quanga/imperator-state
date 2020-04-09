/**
 * @category Utilities
 * @module lib/mappers/data_mapper
 */

const fields = require("../configs/fields/fieldConstants");
const { typeId } = fields;

const UnitModelFactory = require("../models/units/unitModelFactory");
const utils = require("../utils/common");

/**
 * @category Utilities
 * @class DataMapper
 * @requires class:unitModels
 */
class DataMapper {
	constructor() {
		this.__ignore = [];
	}

	static create() {
		return new DataMapper();
	}

	/**
	 * @summary  function that transforms the nodes
	 * stored as JSON and turns them back into their Unit Models
	 * @param {Array} unitArr
	 */
	mapToUnits(unitArr) {
		try {
			return unitArr.map(unit => {
				const newUnit = UnitModelFactory(unit.meta[typeId]);
				newUnit.data = { ...utils.removeNulls(unit.data, unit.data) };
				newUnit.state = { ...unit.state } || {};
				newUnit.meta = { ...unit.meta } || {};

				return newUnit;
			});
		} catch (error) {
			throw new Error("Mapping units error:", error);
		}
	}
}

module.exports = DataMapper;
