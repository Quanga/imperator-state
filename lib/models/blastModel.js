/**
 * @category Blast Service
 * @module lib/models/blastModel
 */
const uuid = require("uuid");
const EventEmitter = require("events").EventEmitter;
const isTimestamp = require("validate.io-timestamp");

/**
 * @category Blast Service
 * @summary Creates an instance of BlastModel.
 * @param {object} snapshot - snapshot of the DataModel supplied by the Data Service
 * @param {number} created - the timestamp from the fire button packet
 * @param {number} duration - the firing time of the process
 * @memberof module:lib/models/blastModel
 */
class BlastModel {
	constructor(snapshot, created, duration) {
		if (!isTimestamp(created))
			throw new Error("Created date is not valid...cannot create Blast Model");

		if (typeof duration !== "number") throw new Error("Duration is not a valid Number - check env");

		if (duration < 10000) throw new Error("Duration is too low for blast report- check env");
		if (!snapshot) throw new Error("Cannot create Blast Model without Starting Snapshot");

		this.event = new EventEmitter();
		const snapShotProcessed = this.createSnapshot(snapshot);

		this.data = {
			id: uuid.v4(),
			created: created,
			firingComplete: null,
			firingTime: null,
			blastClosed: null,
			blastReturnTime: null,
			snapshots: { start: snapShotProcessed.snapShotObj, end: null },
			logs: [],
			state: null
		};

		this.timer = this.setFiringTimer(duration);
		this.blastWatch = snapShotProcessed.blastWatch;
		this.expectedComplete = created + duration;

		this.setState("BLAST_FIRING");
	}

	/**
	 * Function to take in a snapshot from the Data Model and work out the format
	 * @param {*} snapShot Data Model SnapShot Object
	 * @returns {object} Blast Model Snapshot Object
	 */
	createSnapshot(snapShot) {
		const { controlUnit, units } = snapShot;
		try {
			const snapShotObj = {
				controlUnit,
				blastUnits: {},
				excludedUnits: {},
				disarmedUnits: {}
			};

			//check which units are armed and have detonators
			const unitKeys = Object.keys(units);
			const blastWatch = { watchUnits: [], watchDets: {} };

			if (unitKeys.length > 0) {
				for (const unitKey of unitKeys) {
					if (units[unitKey].data.keySwitchStatus === 1 && units[unitKey].units.unitsCount > 0) {
						snapShotObj.blastUnits[unitKey] = units[unitKey];
						blastWatch.watchUnits.push(unitKey);

						if (units[unitKey].hasOwnProperty("children")) {
							const childKeys = Object.keys(units[unitKey].children);
							if (childKeys.length > 0) {
								let liveChildren = childKeys.filter(
									u => units[unitKey].children[u].data.detonatorStatus === 1
								);
								blastWatch.watchDets[unitKey] = [...liveChildren];
							}
						}
					} else if (
						units[unitKey].data.keySwitchStatus === 0 &&
						units[unitKey].units.unitsCount > 0
					) {
						snapShotObj.excludedUnits[unitKey] = units[unitKey];
					} else {
						snapShotObj.disarmedUnits[unitKey] = units[unitKey];
					}
				}
				return { snapShotObj, blastWatch };
			} else {
				console.log("no units found");
				return null;
			}
		} catch (err) {
			console.log(err);
		}
	}

	/**
	 * Sets the state of the Model and Emits the state to be used externally
	 * @param {string} state - eg BLAST_FIRING .
	 * @fires module:lib/models/blastModel.BlastModel#state
	 */
	setState(state) {
		this.event.emit(state);
		this.data.state = state;
	}

	/**
	 * Starts the firing timer in a timeout
	 * @param {number} duration - duration is supplied in the constructor.
	 */
	setFiringTimer(duration) {
		return setTimeout(() => {
			this.closeBlast(Date.now(), true);
		}, duration);
	}

	/**
	 * A number, or a string containing a number.
	 * @typedef {{value: (number|string)}} LogObject
	 */

	/**
	 * Add Log objects from the Event Service to this blast model
	 * @param {Object} logObj the Log Object Wrapper.
	 * @param {string} logObj.id - id of the obj.
	 * @param {LogObject[]} logObj.value - Array of logs.
	 */
	addLog(logObj) {
		if (!Array.isArray(logObj.value)) {
			logObj.value = [logObj.value];
		}

		if (logObj.value[0].modified > this.expectedComplete) {
			return this.closeBlast(logObj.value[0].modified, true);
		}

		this.data.logs.push(logObj.value);

		for (const log of logObj.value) {
			//check to the fireButton off to complete firing part
			if (
				log.typeId === 0 &&
				log.changes.hasOwnProperty("fireButton") &&
				log.changes.fireButton === 0
			) {
				this.data.firingComplete = log.modified;
				this.data.firingTime = this.data.firingComplete - this.data.created;
				this.setState("BLAST_FIRED");
			}

			//check that each unit and det has been returned to end the blast.
			if (log.typeId === 3) {
				//check to see if it is in the list
				const checkBlastUnit = this.blastWatch.watchUnits.findIndex(
					x => x === log.serial.toString()
				);

				if (checkBlastUnit !== -1) {
					this.blastWatch.watchUnits.splice(checkBlastUnit, 1);
				}
			}

			if (log.typeId === 4) {
				//check to see if it is in the list
				if (this.blastWatch.watchDets.hasOwnProperty(log.parentSerial.toString())) {
					const checkDetUnit = this.blastWatch.watchDets[log.parentSerial.toString()].findIndex(
						x => x === log.windowId.toString()
					);

					if (checkDetUnit !== -1) {
						this.blastWatch.watchDets[log.parentSerial].splice(checkDetUnit, 1);
						if (this.blastWatch.watchDets[log.parentSerial].length === 0) {
							delete this.blastWatch.watchDets[log.parentSerial];
						}
					}
				}
			}

			if (
				Object.keys(this.blastWatch.watchDets).length === 0 &&
				this.blastWatch.watchUnits.length === 0 &&
				this.data.state !== "BLAST_DATA_COMPLETE"
			) {
				this.closeBlast(log.modified);
			}
		}
	}

	closeBlast(time, timed) {
		clearTimeout(this.timer);
		this.timer = null;
		this.data.blastClosed = time;
		this.data.blastReturnTime = this.data.blastClosed - this.data.firingComplete;
		if (!timed) {
			this.setState("BLAST_DATA_COMPLETE");
		} else {
			this.setState("BLAST_TIMER_COMPLETE");
		}
	}

	/**
	 * This will be an instance member, Observable#publish.
	 */
	endBlast(snapshot) {
		this.data.snapshots.end = this.createSnapshot(snapshot).snapShotObj;
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
