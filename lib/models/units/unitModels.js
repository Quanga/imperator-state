/* eslint-disable max-len */
/* eslint-disable no-unused-vars */
/**
 * @category Unit Models
 * @module lib/models/UnitBaseModel
 */

const EventEmitter = require("events").EventEmitter;

const fields = require("../../configs/fields/fieldConstants");
const { communicationStatus, typeId, serial, counts } = fields;
const { parentSerial, windowId, parentType, path, modifiedAt } = fields;

/**
 * @category Unit Models
 * @class UnitBaseModel
 * @summary Base Class Unit Models for the DataModel.
 * @memberof module:lib/models/UnitBaseModel
 */
class UnitBaseModel extends EventEmitter {
	constructor() {
		super();

		this.meta = { [path]: "" };
		this.state = { [communicationStatus]: 1 };
		this.data = {};

		this.func = {};
	}

	withAggregator(category, type, agg) {
		if (!this[counts]) this[counts] = {};
		if (!this[counts][type]) this[counts][type] = {};
		if (!this[counts][type][category]) this[counts][type][category] = {};

		this[counts][type][category][agg] = 0;
		return this;
	}

	withTypeId(tId) {
		this.meta[typeId] = tId;
		return this;
	}

	withSerial(srl) {
		this.meta[serial] = srl;
		return this;
	}

	withParent(srl) {
		this.meta[parentSerial] = srl;
		return this;
	}

	withParentType(type) {
		this.meta[parentType] = type;
		return this;
	}

	withEvents(events) {
		this.unitEvents = events;
		return this;
	}

	setPath() {
		this.meta.path = `${this.meta[typeId]}/${this.meta[serial]}`;
		return this;
	}

	setObj(key, data) {
		this[key] = { ...this[key], ...data };
		return this;
	}

	withFSM(fsm) {
		this.func.machine = fsm;

		return this;
	}

	get fsm() {
		return this.func.machine;
	}

	setState() {
		return this;
	}

	build() {
		delete this.setPath();
		return this;
	}

	get unitData() {
		return {
			meta: { ...this.meta },
			data: { ...this.data },
			state: { ...this.state },
			children: { ...this.children },
			counts: { ...this.counts },
		};
	}
}

/**
 * @category Unit Models
 * @class PrimaryUnitModel
 * @summary Control Unit for the DataModel.
 * @memberof module:lib/models/UnitBaseModel
 */
class PrimaryUnitModel extends UnitBaseModel {
	constructor() {
		super();

		this.children = {};
	}
}

/**
 * @category Unit Models
 * @class SecondaryUnitModel
 * @summary Control Unit for the DataModel.
 * @memberof module:lib/models/UnitBaseModel
 */
class SecondaryUnitModel extends UnitBaseModel {
	constructor() {
		super();
	}

	withWindowId(wId) {
		this.meta[windowId] = wId;
		return this;
	}

	setPath() {
		const { meta } = this;
		meta.path = `${meta[parentType]}/${meta[parentSerial]}/${meta[typeId]}/${meta[windowId]}`;
		return this;
	}

	setState() {
		this.state.communicationStatus = this.data.detonatorStatus || 0;
		return this;
	}
}

module.exports = {
	PrimaryUnitModel,
	SecondaryUnitModel,
};
