const fields = require("../configs/fields/fieldConstants");
const { typeId } = fields;

/** Class Builder for unit objects */
class UnitBuilder {
	static create(factory) {
		if (!factory) throw new Error("Unitbuilder create must have factory supplied");

		const unitBuilder = new UnitBuilder();
		unitBuilder.factory = factory;
		return unitBuilder;
	}

	/**
	 * Build from an array.
	 */
	async fromArray(packetObj) {
		const { results } = packetObj;
		const result = { units: [] };

		await Promise.all(results.map(item => this.buildObj(item, result)));

		if (Object.prototype.hasOwnProperty.call(packetObj, "signal")) {
			result.signal = packetObj.signal;
		}

		return result;
	}

	async buildObj(model, context) {
		try {
			const unitModel = this.factory(model.meta[typeId]);
			unitModel
				.setObj("data", model.data)
				.setObj("meta", model.meta)
				.setPath()
				.setState();

			context.units.push(unitModel);

			return context;
		} catch (error) {
			console.log(error);
		}
	}
}

module.exports = UnitBuilder;
