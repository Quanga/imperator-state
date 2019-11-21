const uuid = require("uuid");
const EventEmitter = require("events").EventEmitter;
const isTimestamp = require("validate.io-timestamp");

const { blastModelStates } = require("../constants/stateConstants");
const { eventServiceLogTypes } = require("../constants/typeConstants");

/**
 * @module lib/models/BlastModel
 */

/**
 * @class
 * @summary Creates an instance of BlastModel.
 * @param {object} snapshot - snapshot of the DataModel supplied by the Data Service
 * @param {number} createdAt - the timestamp from the fire button packet
 * @param {number} duration - the firing time of the process
 * @memberof module:lib/models/BlastModel
 */
class BlastModel extends EventEmitter {
	constructor() {
		super();
		this.opts = {};
		this.data = {
			id: uuid.v4(),
			serial: null,
			createdAt: null,
			firingComplete: null,
			firingTime: null,
			blastClosed: null,
			blastReturnTime: null,
			snapshots: { start: null, end: null },
			logs: [],
			state: null,
		};
	}

	static create(timestamp) {
		if (!isTimestamp(timestamp))
			throw new Error("Created date is not valid...cannot create Blast Model");

		const blastModel = new BlastModel();
		blastModel.data.createdAt = timestamp;
		return blastModel;
	}

	withOpts(opts) {
		const { firingDuration, reportingDuration } = opts;
		if (typeof firingDuration !== "number")
			throw new Error("Firing Duration is not a valid Number - check env");

		if (typeof reportingDuration !== "number")
			throw new Error("Report Duration is not a valid Number - check env");

		if (!process.env.NODE_ENV === "test" && reportingDuration < 10000)
			throw new Error(`Report Duration is too low - ${reportingDuration}ms`);

		if (!process.env.NODE_ENV === "test" && firingDuration < 10000)
			throw new Error(`Firing Duration is too low - ${firingDuration}ms`);

		this.opts.firingDuration = firingDuration;
		this.opts.reportingDuration = reportingDuration;
		const totalDuration = firingDuration + reportingDuration;
		this.timer = this.setTotalTimer(this.data.createdAt, totalDuration);
		this.expectedComplete = this.data.createdAt + totalDuration;

		return this;
	}

	withSnapshot(snapshot) {
		if (typeof snapshot !== "object" || snapshot.constructor !== Object)
			throw new Error("Snapshot must be suppled as an Object");

		const { controlUnit, units } = snapshot;

		const aggregatedUnits = this.aggregateUnits(units);

		this.data.serial = snapshot.controlUnit.data.serial;
		this.data.snapshots.start = {
			controlUnit,
			...aggregatedUnits,
		};
		this.watchLists = this.extractWatchLists(aggregatedUnits.blastUnits);

		return this;
	}

	start() {
		this.setState(blastModelStates.BLAST_FIRING);
		return this;
	}

	/**
	 * @summary Aggregates the types of units
	 * @param {*} units
	 */
	aggregateUnits(units) {
		return Object.keys(units).reduce(
			(acc, cur) => {
				const { keySwitchStatus } = units[cur].data;
				const { unitsCount } = units[cur].units;

				if (keySwitchStatus === 1 && unitsCount > 0) acc.blastUnits[cur] = units[cur];
				else if (keySwitchStatus === 0 && unitsCount > 0) acc.excludedUnits[cur] = units[cur];
				else acc.disarmedUnits[cur] = units[cur];

				return acc;
			},
			{
				blastUnits: {},
				excludedUnits: {},
				disarmedUnits: {},
			},
		);
	}

	/**
	 *
	 * @summary Extracts the units for data return
	 * @param {*} units
	 */
	extractWatchLists(units) {
		return Object.keys(units).reduce(
			(acc, cur) => {
				if (units[cur].children) {
					const live = Object.keys(units[cur].children).filter(
						det => units[cur].children[det].data.detonatorStatus === 1,
					);
					acc.units[cur] = live;
					acc.count = ++acc.count;
				}
				return acc;
			},
			{ units: {}, count: 0 },
		);
	}

	/**
	 * Sets the state of the Model and Emits the state to be used externally
	 * @param {string} state - eg BLAST_FIRING .
	 * @fires BlastModel#state
	 */
	setState(next) {
		const { state } = this.data;

		if (
			state === blastModelStates.BLAST_DATA_COMPLETE ||
			state === blastModelStates.BLAST_TIMER_COMPLETE ||
			state === blastModelStates.BLAST_TIMER_COMPLETE_BYPACKET
		)
			return;

		this.emit("log", next);
		this.data.state = next;
	}

	/**
	 * Starts the total timer in a timeout
	 * @param {number} createdAt - when the event started.
	 * @param {number} duration - duration is supplied in the constructor.
	 */
	setTotalTimer(createdAt, duration) {
		return setTimeout(() => {
			this.setState(blastModelStates.BLAST_TIMER_COMPLETE);
			this.closeBlast(createdAt + duration);
		}, duration);
	}

	/**
	 * Add Log objects from the Event Service to this blast model
	 * @param {Object} logObj the Log Object Wrapper.
	 * @param {string} logObj.id - id of the obj.
	 * @param {LogObject[]} logObj.value - Array of logs.
	 */
	addLog(logObj) {
		const { createdAt, logType } = logObj;

		if (createdAt > this.expectedComplete) {
			this.setState(blastModelStates.BLAST_TIMER_COMPLETE_BYPACKET);
			this.closeBlast(createdAt);
			return;
		}

		this.data.logs.push(logObj);
		let proceed;

		switch (logType) {
			case eventServiceLogTypes.UNIT_UPDATE:
				proceed = this.handleUnitStateChange(logObj);
				break;
			case eventServiceLogTypes.DET_UPDATE:
				proceed = this.handleDetStateChange(logObj);
				break;
		}

		if (
			proceed &&
			this.watchLists.count === 0 &&
			this.data.state !== blastModelStates.BLAST_DATA_COMPLETE
		) {
			this.setState(blastModelStates.BLAST_DATA_COMPLETE);
			this.closeBlast(createdAt);
		}
	}

	handleUnitStateChange(logObj) {
		const { typeId, events, createdAt } = logObj;
		const logEvents = events[0];

		switch (typeId) {
			case 0:
				if (
					Object.prototype.hasOwnProperty.call(logEvents, "diff") &&
					Object.prototype.hasOwnProperty.call(logEvents.diff, "fireButton") &&
					logEvents.diff.fireButton === 0
				) {
					this.data.firingComplete = createdAt;
					this.data.firingTime = this.data.firingComplete - this.data.createdAt;
					this.setState(blastModelStates.BLAST_FIRED);
				}
				// TODO need to get event for an DIRARMED TERMINATE
				if (
					Object.prototype.hasOwnProperty.call(logEvents, "diff") &&
					Object.prototype.hasOwnProperty.call(logEvents.diff, "keySwitchStatus") &&
					logEvents.diff.keySwitchStatus === 0 &&
					this.state === blastModelStates.BLAST_FIRING
				) {
					this.data.firingComplete = createdAt;
					this.data.firingTime = 0;
					this.setState(blastModelStates.BLAST_TERMINATED);
					return false;
				}
				break;
		}

		return true;
	}

	handleDetStateChange(logObj) {
		const { units } = this.watchLists;
		const { serial, events } = logObj;

		if (Object.prototype.hasOwnProperty.call(units, logObj.serial.toString())) {
			const windowIdList = events.map(ev => ev.windowId.toString());

			units[serial] = units[serial].filter(el => {
				return !windowIdList.includes(el);
			});

			if (units[serial].length === 0) {
				delete units[serial];
				this.watchLists.count--;
			}
		}

		return true;
	}

	closeBlast(time) {
		if (this.timer) {
			clearTimeout(this.timer);
			this.timer = null;
		}
		if (!this.firingComplete) this.firingComplete = time;
		this.data.blastClosed = time;
		this.data.blastReturnTime = this.data.blastClosed - this.data.firingComplete;
	}

	setSnapshot(snapshot, position) {
		this.data.snapshots[position] = this.createSnapshot(snapshot).snapShotObj;
	}

	async getBlastReport() {
		return this.data;
	}
}

/**
 * @summary BlastModel State event.
 * @category Services
 * @event state
 * @type {object}
 * @property {string} state - Indicates the state change of the Blast Model.
 * @memberof BlastModel#
 */

module.exports = BlastModel;
