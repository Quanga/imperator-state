/* eslint-disable no-prototype-builtins */
/**
 * @module lib/models/blastModel
 */
const EventEmitter = require("events").EventEmitter;
const isTimestamp = require("validate.io-timestamp");

const { Machine, interpret } = require("xstate");

const fields = require("../configs/fields/fieldConstants");
const { communicationStatus, createdAt, serial, windowId } = fields;

/**
 * @class BlastModel
 * @summary Creates an instance of BlastModel.
 * @param {number} timeStamp - timestamp from the firebutton event packet
 * @memberof module:lib/models/blastModel
 */
class BlastModel extends EventEmitter {
	constructor(timeStamp) {
		super();
		this.meta = { id: null, createdAt: timeStamp, serial: null };

		this.times = {
			initiate: timeStamp,
			firingComplete: null,
			blastClosed: null,
		};

		this.timers = { firing: 0, reporting: 0 };
		this.data = { snapshots: {}, logs: [] };
		this.state = { currentState: null };
	}

	//#region Builder Methods

	/**
	 * Static create method which takes a timestamp
	 * @static
	 * @param {number} timeStamp
	 * @returns {BlastModel} this
	 * @memberof module:lib/models/blastModel~BlastModel
	 */
	static create(timeStamp) {
		if (!isTimestamp(timeStamp)) throw new Error("BlastModel must be created with a valid timestamp");

		const blastModel = new BlastModel(timeStamp);
		return blastModel;
	}

	/**
	 * Specify the stored Id of the blast event
	 * @function withId
	 * @param {number} timeStamp
	 * @returns {BlastModel} this
	 * @memberof module:lib/models/blastModel~BlastModel
	 */
	withId(id) {
		this.meta.id = id;
		return this;
	}

	/**
	 * Specify the two timers - firing and report for the blast model
	 * @function withTimer
	 * @param {string} name the name of the timer [ firing | report ]
	 * @param {number} duration duration of the timer in ms
	 * @returns {BlastModel} this
	 * @memberof module:lib/models/blastModel~BlastModel
	 */
	withTimer(name, duration) {
		if (typeof name !== "string") throw new Error("Name is not a valid string");
		if (typeof duration !== "number") throw new Error("Duration is not a valid Number - check env");

		this.timers[name] = duration;
		return this;
	}

	/**
	 * Specify the startFunction of the blast event
	 * @function withSnapshot
	 * @param {number} timeStamp
	 * @returns {BlastModel} this
	 * @memberof module:lib/models/blastModel~BlastModel
	 */
	withSnapshot(snapShot) {
		if (typeof snapShot !== "object" || snapShot.constructor !== Object)
			throw new Error("Snapshot must be suppled as an Object");

		const snapShotProcessed = this.formatSnapShot(snapShot);
		this.meta.serial = Object.keys(snapShotProcessed.snapShotObj.controlUnit)[0];
		this.data.snapshots.start = snapShotProcessed.snapShotObj;
		this.watchLists = snapShotProcessed.watchLists;

		return this;
	}

	/**
	 * Inject the Finite State Machine with all options into the model
	 * @function withFSM
	 * @param {Object} fsm the BlastConfig object
	 * @returns {BlastModel} this
	 * @memberof module:lib/models/blastModel~BlastModel
	 */
	withFSM(fsm) {
		const fsmObj = fsm.bind(this)({ ...this.timers });

		this.state.fsm = Machine(fsmObj[0], fsmObj[1]);
		this.state.fsmService = interpret(this.state.fsm)
			.onTransition(state => {
				if (state.changed) {
					this.state.currentState = { context: state.context, value: state.value };
					this.emit("state", { context: state.context, state: state.value });
				}
			})
			.start();

		this.state.fsmService.send("FIRING", { createdAt: this.meta.createdAt });

		return this;
	}

	/**
	 * Check and start the blastModel
	 * @function start
	 * @returns {BlastModel} this
	 * @memberof module:lib/models/blastModel~BlastModel
	 */
	start() {
		Object.keys(this.timers).forEach(timer => {
			if (timer < 1000) throw new Error("timer values too low");
		});

		this.times.totalDuration = Object.keys(this.timers).reduce((a, c) => a + this.timers[c], 0);
		this.times.expectedComplete = this.times.initiate + this.times.totalDuration;

		this.emit("log", `Creating new blast - ${this.meta.id} - ${this.meta[createdAt]}`);
		return this;
	}

	//#endregion

	//#region Format Snapshots
	/**
	 * Take the DataModel snapshot and create the active units
	 * @param {Object} snapShot Data Model SnapShot Object
	 * @returns {object} Blast Model Snapshot Object
	 */
	setSnapshot(snapshot, position) {
		this.data.snapshots[position] = this.formatSnapShot(snapshot).snapShotObj;
	}

	formatSnapShot(snapshot) {
		try {
			const aggregatedUnits = this.aggregateUnits(snapshot);

			const snapShotObj = { controlUnit: snapshot[0], ...aggregatedUnits };
			const watchLists = this.extractParticipants(snapshot, aggregatedUnits);

			return { snapShotObj, watchLists };
		} catch (err) {
			this.emit("error", err);
		}
	}

	/**
	 * Aggregate the units into - active, inactive and excluded
	 * @param {Object} snapShot Data Model SnapShot Object
	 * @returns {object} Blast Model Snapshot Object
	 * @todo need to remove bl from here.
	 */
	aggregateUnits(units) {
		if (!units) throw new Error("Invalid units object supplied to aggregateUnits");

		const result = Object.keys(units["3"]).reduce(
			(acc, cur) => {
				if (
					units["3"][cur].data.keySwitchStatus === 1 &&
					units["3"][cur].state.communicationStatus === 1
				) {
					if (!units["3"][cur].children["4"] || units["3"][cur].children["4"].length === 0) {
						acc.excluded[cur] = units["3"][cur];
						acc.excluded[cur].childUnits = { ...units["4"][cur] };
					} else {
						acc.active[cur] = units["3"][cur];
						acc.active[cur].childUnits = { ...units["4"][cur] };
					}
				} else {
					acc.inactive[cur] = units["3"][cur];
				}
				return acc;
			},
			{ active: {}, excluded: {}, inactive: {} },
		);
		return result;
	}

	/**
	 * Extract the watch list for the blast
	 * @param {Object} snapShot Data Model SnapShot Object
	 * @param {Object} units model
	 * @returns {object} watchList
	 * @todo need to remove bl from here.
	 */
	extractParticipants(snapShot, units) {
		const { active } = units;

		return Object.keys(active).reduce(
			(acc, cur) => {
				if (active[cur].children) {
					const detKeys = active[cur].children[4];

					if (!detKeys || detKeys.length === 0) return acc;

					const liveChildren = detKeys.filter(
						det => snapShot[4][cur][det].state[communicationStatus] === 1,
					);

					acc.units[cur] = [...liveChildren];
					acc.count++;

					return acc;
				}
			},
			{ units: {}, count: 0 },
		);
	}
	//#endregion

	//#region STATE CHANGE OPERATIONS

	/**
	 * @typedef {Object} StateObj
	 * @property {string | number } serial
	 * @property {number} typeId
	 * @property {number} createdAt
	 * @property {Object} state
	 * @property {string} state.operation
	 * @property {string} state.faults
	 * @example  { serial: 8, typeId: 0, createdAt: 1575010208376, state: { operation: 'firing_complete', faults: 'none' } }
	 */

	/**
	 * Change the state of the FSM
	 * @param {StateObj} obj Data Model SnapShot Object
	 * @returns {void}
	 * @todo need to remove bl from here.
	 *
	 */
	toggleState(obj) {
		let trigger;
		if (obj.state.operation === "firing_complete") trigger = "FIRING_COMPLETE";

		if (trigger) this.state.fsmService.send(trigger, { createdAt: obj.createdAt });
	}

	/**
	 * Add a log object to the BlastModel
	 * @param {Object} logObj EventService Log Object
	 * @returns {object} watchList
	 * @todo need to remove bl from here.
	 */
	addLog(logObj) {
		if (logObj.meta["createdAt"] > this.times.expectedComplete) {
			this.state.fsmService.send("PSEUDO_COMPLETE", { createdAt: logObj.meta["createdAt"] });
			return true;
		}

		this.data.logs.push(logObj);

		let proceed;
		if (logObj.data.events) {
			proceed = this.updateWatchList(logObj);
		}

		if (proceed && this.watchLists.count === 0 && this.state.currentState.value !== "data_complete") {
			this.state.fsmService.send("DATA_RETURNED", { createdAt: logObj.meta.createdAt });
		}
	}

	/**
	 * Removes items from the watchlist as they are discovered in the logs
	 * @param {LogModel} logObj EventService Log Object
	 * @returns {boolean}
	 */
	updateWatchList(logObj) {
		const { units } = this.watchLists;

		if (logObj.data.events) {
			if (units.hasOwnProperty(logObj.meta[serial].toString())) {
				if (logObj.data.hasOwnProperty("events") && logObj.data.events.hasOwnProperty("4")) {
					const windowIdList = logObj.data.events["4"].map(ev => ev.meta[windowId]);

					units[logObj.meta[serial]] = units[logObj.meta[serial]].filter(
						el => !windowIdList.includes(el),
					);

					if (units[logObj.meta[serial]].length === 0) {
						delete units[logObj.meta[serial]];
						this.watchLists.count--;
					}
				}
			}

			return true;
		}
		return false;
	}
	//#endregion

	//#region Getters

	/**
	 *
	 * Return the blastReport Object
	 * @readonly blastReport
	 * @memberof BlastModel
	 */
	get blastReport() {
		return {
			meta: { ...this.meta },
			data: { ...this.data },
			times: { ...this.times, ...this.state.currentState.context },
			state: this.state.currentState.value,
		};
	}
}

module.exports = BlastModel;
