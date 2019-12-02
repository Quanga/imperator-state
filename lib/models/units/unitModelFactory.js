/* eslint-disable no-prototype-builtins */
const fields = require("../../configs/fields/fieldConstants");
const { parentType } = fields;

const Units = require("./unitModels");
const schemas = require("../../configs/units/unitSchema");

const unitModelFactory = type => {
	const unitSchema = schemas[type];
	const unit = new Units[unitSchema.schema]().withTypeId(type);

	// if parentType is specified in schema add to unit
	if (unitSchema.hasOwnProperty(parentType)) {
		unit.withParentType(unitSchema[parentType]);
	}

	// if overrides is specified in schema add to unit
	if (unitSchema.hasOwnProperty("defaultOverrides")) {
		unitSchema.defaultOverrides.forEach(override => {
			const overrideEntries = Object.entries(override);

			const overridableObj = ["state", "data"];
			overridableObj.forEach(obj => {
				if (Object.prototype.hasOwnProperty.call(unit[obj], overrideEntries[0][0])) {
					unit[obj][overrideEntries[0][0]] = overrideEntries[0][1];
				}
			});
		});
	}
	// if overrides is specified in schema add to unit
	// if (unitSchema.hasOwnProperty("deriveValue")) {
	// 	unitSchema.deriveValue.forEach(override => {
	// 		const overrideProp = Object.entries(override);

	// 		const overridableObj = ["state"];

	// 		overridableObj.forEach(obj => {
	// 			if (Object.prototype.hasOwnProperty.call(unit[obj], overrideProp[0][0])) {
	// 				unit[obj][overrideProp[0][0]] = unit[overrideProp[0][1]];
	// 			}
	// 		});
	// 	});
	// }
	// if counts is specified in schema add to unit
	if (unitSchema.hasOwnProperty("aggregators")) {
		const aggregatorTypeKeys = Object.keys(unitSchema.aggregators);

		aggregatorTypeKeys.forEach(aggTypeKey => {
			const aggregatorCategories = Object.keys(unitSchema.aggregators[aggTypeKey]);
			aggregatorCategories.forEach(aggregatoryCat => {
				unitSchema.aggregators[aggTypeKey][aggregatoryCat].forEach(aggregator => {
					unit.withAggregator(aggregatoryCat, aggTypeKey, aggregator);
				});
			});
		});
	}

	if (unitSchema.hasOwnProperty("commTimeout")) {
		unit.func.commTimeout = unitSchema.commTimeout;
	}

	return unit;
};

module.exports = unitModelFactory;
