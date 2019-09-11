/**
 * @category Blast Service
 * @module lib/models/blastModel
 */
const uuid = require("uuid");
const EventEmitter = require("events").EventEmitter;
const isTimestamp = require("validate.io-timestamp");

const { blastModelStates, blastUnitStates } = require("../constants/stateConstants");
const { blastModelEvents, eventServiceLogTypes } = require("../constants/eventConstants");

/**
 * @category Blast Service
 * @summary Creates an instance of BlastModel.
 * @param {object} snapshot - snapshot of the DataModel supplied by the Data Service
 * @param {number} createdAt - the timestamp from the fire button packet
 * @param {number} duration - the firing time of the process
 * @memberof module:lib/models/blastModel
 */
class BlastModel {
	constructor(snapshot, createdAt, firingDuration, reportingDuration) {
		this.validate(snapshot, createdAt, firingDuration, reportingDuration);

		this.event = new EventEmitter();
		const snapShotProcessed = this.createSnapshot(snapshot);

		this.data = {
			id: uuid.v4(),
			serial: snapshot.controlUnit.data.serial,
			createdAt: createdAt,
			firingComplete: null,
			firingTime: null,
			blastClosed: null,
			blastReturnTime: null,
			snapshots: { start: snapShotProcessed.snapShotObj, end: null },
			logs: [],
			state: null
		};

		const totalDuration = firingDuration + reportingDuration;
		this.timer = this.setTotalTimer(createdAt, totalDuration);
		this.watchLists = snapShotProcessed.watchLists;
		this.expectedComplete = createdAt + totalDuration;

		this.setState(blastModelStates.BLAST_FIRING);
	}

	/**
	 * @summary validate the args coming into the Blast Model
	 * @param {string || number} serial Data Model SnapShot Object
	 * @param {object} snapShot Data Model SnapShot Object
	 * @param {number} createdAt Data Model SnapShot Object
	 * @param {number} duration Data Model SnapShot Object
	 * @returns {bool} Blast Model Snapshot Object
	 */
	validate(snapshot, createdAt, firingDuration, reportingDuration) {
		for (let index = 0; index < arguments.length; index++) {
			if (!arguments[index])
				throw new Error("All arguments must be specified to create a Blast Model");
		}

		if (typeof snapshot !== "object" || snapshot.constructor !== Object)
			throw new Error("Snapshot must be suppled as an Object");

		if (!isTimestamp(createdAt))
			throw new Error("Created date is not valid...cannot create Blast Model");

		if (typeof firingDuration !== "number")
			throw new Error("Firing Duration is not a valid Number - check env");

		if (typeof reportingDuration !== "number")
			throw new Error("Report Duration is not a valid Number - check env");

		if (!process.env.NODE_ENV === "test" && reportingDuration < 10000)
			throw new Error(`Report Duration is too low - ${reportingDuration}ms`);

		if (!process.env.NODE_ENV === "test" && firingDuration < 10000)
			throw new Error(`Firing Duration is too low - ${firingDuration}ms`);

		return true;
	}

	/**
	 * Function to take in a snapshot from the Data Model and work out the format
	 * @param {*} snapShot Data Model SnapShot Object
	 * @returns {object} Blast Model Snapshot Object
	 */
	createSnapshot(snapShot) {
		const { controlUnit, units } = snapShot;
		try {
			const aggregatedUnits = this.aggregateUnits(units);

			const snapShotObj = {
				controlUnit,
				...aggregatedUnits
			};

			const watchLists = this.extractWatchLists(aggregatedUnits.blastUnits);

			return { snapShotObj, watchLists };
		} catch (err) {
			console.log(err);
		}
	}

	aggregateUnits(units) {
		const unitSnapshot = { blastUnits: {}, excludedUnits: {}, disarmedUnits: {} };

		const unitKeys = Object.keys(units);
		if (unitKeys.length === 0) return null;

		unitKeys.forEach(unitKey => {
			const { keySwitchStatus } = units[unitKey].data;
			const { unitsCount } = units[unitKey].units;

			let state = blastUnitStates.DISARMED;

			if (keySwitchStatus === 1 && unitsCount > 0) state = blastUnitStates.ARMED;
			if (keySwitchStatus === 0 && unitsCount > 0) state = blastUnitStates.EXCLUDED;

			switch (state) {
			case blastUnitStates.ARMED:
				unitSnapshot.blastUnits[unitKey] = units[unitKey];
				break;
			case blastUnitStates.DISARMED:
				unitSnapshot.disarmedUnits[unitKey] = units[unitKey];
				break;
			case blastUnitStates.EXCLUDED:
				unitSnapshot.excludedUnits[unitKey] = units[unitKey];
				break;
			}
		});

		return unitSnapshot;
	}

	extractWatchLists(units) {
		const blastParticipants = { units: {}, count: 0 };

		const unitKeys = Object.keys(units);

		unitKeys.forEach(unitKey => {
			if (units[unitKey].hasOwnProperty("children")) {
				const detKeys = Object.keys(units[unitKey].children);

				if (detKeys.length > 0) {
					let liveChildren = detKeys.filter(
						det => units[unitKey].children[det].data.detonatorStatus === 1
					);

					blastParticipants.units[unitKey] = [...liveChildren];
					blastParticipants.count++;
				}
			}
		});
		return blastParticipants;
	}

	/**
	 * Sets the state of the Model and Emits the state to be used externally
	 * @param {string} state - eg BLAST_FIRING .
	 * @fires module:lib/models/blastModel.BlastModel#state
	 */
	setState(state) {
		this.event.emit(blastModelEvents.BLASTMODEL_LOG, state);
		this.data.state = state;
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
	 * A number, or a string containing a number.
	 * @typedef {{value: (number|string)}} LogObject
	 * @todo fix this section, it is wrong
	 */

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
				logEvents.hasOwnProperty("diff") &&
					logEvents.diff.hasOwnProperty("fireButton") &&
					logEvents.diff.fireButton === 0
			) {
				this.data.firingComplete = createdAt;
				this.data.firingTime = this.data.firingComplete - this.data.createdAt;
				this.setState(blastModelStates.BLAST_FIRED);
			}
			// TODO need to get event for an DIRARMED TERMINATE
			if (
				logEvents.hasOwnProperty("diff") &&
					logEvents.diff.hasOwnProperty("keySwitchStatus") &&
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

		if (units.hasOwnProperty(logObj.serial.toString())) {
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
 * BlastModel State event.
 * @category Blast Service
 * @event module:lib/models/blastModel.BlastModel#state
 * @type {object}
 * @property {string} state - Indicates the state change of the Blast Model.
 */

module.exports = BlastModel;
