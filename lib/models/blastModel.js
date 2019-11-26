/* eslint-disable no-prototype-builtins */
/**
 * @category Blast Service
 * @module lib/models/blastModel
 */
const uuid = require("uuid");
const EventEmitter = require("events").EventEmitter;
const isTimestamp = require("validate.io-timestamp");

const { blastModelStates } = require("../configs/states/stateConstants");
const { eventServiceLogTypes } = require("../constants/typeConstants");
const { Machine, interpret } = require("xstate");

const fields = require("../configs/fields/fieldConstants");
const { communicationStatus, createdAt, serial, windowId } = fields;

/**
 * @category Blast Service
 * @summary Creates an instance of BlastModel.
 * @param {object} snapshot - snapshot of the DataModel supplied by the Data Service
 * @param {number} createdAt - the timestamp from the fire button packet
 * @param {number} duration - the firing time of the process
 * @memberof module:lib/models/blastModel
 */
class BlastModel extends EventEmitter {
	constructor(timeStamp) {
		super();
		if (!isTimestamp(timeStamp)) throw new Error("BlastModel must be created with a valid timestamp");

		this.meta = {
			id: uuid.v4(),
			createdAt: timeStamp,
		};

		this.opts = {
			firingDuration: 0,
			reportingDuration: 0,
		};

		this.times = {
			initiate: timeStamp,
			firingComplete: null,
			blastClosed: null,
			blastReturnTime: null,
		};

		this.data = {
			snapshots: {},
			logs: [],
		};

		this.state = { currentState: null };
		this.func = { fsm: null, fsmService: null };
	}

	//#region Builder Methods

	static create(timeStamp) {
		const blastModel = new BlastModel(timeStamp);
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

		this.times.totalDuration = firingDuration + reportingDuration;
		this.times.expectedComplete = this.times.startTime + this.times.totalDuration;

		return this;
	}

	withSnapshot(snapShot) {
		if (typeof snapShot !== "object" || snapShot.constructor !== Object)
			throw new Error("Snapshot must be suppled as an Object");

		const snapShotProcessed = this.formatSnapShot(snapShot);
		this.data.snapshots.start = snapShotProcessed.snapShotObj;

		this.watchLists = snapShotProcessed.watchLists;

		return this;
	}

	withFSM(fsm) {
		this.state.fsm = Machine(fsm);
		this.state.fsmService = interpret(this.state.fsm).onTransition(state => {
			if (state.changed) {
				this.state.currentState = state.value;
				console.log("EMITTING BLAST", state.value);
				this.emit("state", state.value);
			}
		});

		this.state.fsmService.start();
		return this;
	}

	withTriggers(opts) {
		this.triggers = opts.events;
		this.states = opts.states;

		return this;
	}

	start() {
		//this.timer = this.setTotalTimer(this.times.startTime, this.opts.totalDuration);
		//this.setState(blastModelStates.BLAST_FIRING);
		this.emit("log", `Creating new blast - ${this.meta.id} - ${this.meta[createdAt]}`);
		return this;
	}

	//#endregion

	//#region Format Snapshots
	/**
	 * Function to take in a snapshot from the Data Model and work out the format
	 * @param {*} snapShot Data Model SnapShot Object
	 * @returns {object} Blast Model Snapshot Object
	 */
	formatSnapShot(snapshot) {
		try {
			const aggregatedUnits = this.aggregateUnits(snapshot["3"]);
			const snapShotObj = { controlUnit: snapshot[0], ...aggregatedUnits };
			const watchLists = this.extractParticipants(snapshot, aggregatedUnits);

			return { snapShotObj, watchLists };
		} catch (err) {
			this.emit("error", err);
		}
	}

	aggregateUnits(units) {
		if (!units) throw new Error("Invalid units object supplied to aggregateUnits");

		const result = Object.keys(units).reduce(
			(acc, cur) => {
				if (units[cur].data.keySwitchStatus === 1 && units[cur].state.communicationStatus === 1) {
					if (units[cur].children[4] && units[cur].children[4].length === 0) {
						acc.excluded[cur] = units[cur];
					}

					acc.active[cur] = units[cur];
				} else {
					acc.inactive[cur] = units[cur];
				}
				return acc;
			},
			{ active: {}, excluded: {}, inactive: {} },
		);
		return result;
	}

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

	//#region State Changers

	toggleState(pState, nState) {
		const { triggers } = this;
		const triggerKeys = Object.keys(triggers);

		let done;
		triggerKeys.forEach(triggerKey => {
			if (!done) {
				let prevResult, prevKeys, nextResult, nextKeys;

				prevKeys = Object.keys(triggers[triggerKey].prev);
				const prevTriggers = triggers[triggerKey].prev;
				prevResult = prevKeys.filter(prevKey => prevTriggers[prevKey] === pState[prevKey]);

				if (prevResult.length === prevKeys.length) {
					nextKeys = Object.keys(triggers[triggerKey].next);
					nextResult = nextKeys.filter(
						nextKey => triggers[triggerKey].next[nextKey] === nState[nextKey],
					);

					if (nextResult.length === nextKeys.length && prevResult.length === prevKeys.length) {
						//console.log("SENDING", triggerKey);
						this.fsmService.send(triggerKey);
						done = true;
					}
				}
			}
		});
	}

	addLog(logObj) {
		const { logType } = logObj;

		if (logObj[createdAt] > this.times.expectedComplete) {
			//this.setState(blastModelStates.BLAST_TIMER_COMPLETE_BYPACKET);
			//this.closeBlast(logObj[fields.createdAt]);
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
			this.state.currentState !== blastModelStates.BLAST_DATA_COMPLETE
		) {
			//this.setState(blastModelStates.BLAST_DATA_COMPLETE);
			this.closeBlast(logObj[fields.createdAt]);
		}
	}

	handleUnitStateChange(logObj) {
		console.log("HANDLING CHANGE IN UNIT");
		const { typeId, events, createdAt } = logObj;
		const logEvents = events[0];

		switch (typeId) {
			case 0:
				if (
					logEvents.hasOwnProperty("diff") &&
					logEvents.diff.hasOwnProperty("fireButton") &&
					logEvents.diff.fireButton === 0
				) {
					this.times.firingComplete = createdAt;
					this.times.firingTime = this.times.firingComplete - this.meta.createdAt;
					this.state.fsmService.send("FIRING_COMPLETE");
				}
				// TODO need to get event for an DIRARMED TERMINATE
				if (
					logEvents.hasOwnProperty("diff") &&
					logEvents.diff.hasOwnProperty("keySwitchStatus") &&
					logEvents.diff.keySwitchStatus === 0 &&
					this.state.currentState === blastModelStates.BLAST_FIRING
				) {
					this.times.firingComplete = createdAt;
					this.times.firingTime = 0;
					this.state.fsmService.send("ABORT");
					return false;
				}
				break;
		}

		return true;
	}

	handleDetStateChange(logObj) {
		const { units } = this.watchLists;
		const { events } = logObj;

		if (units.hasOwnProperty(logObj[serial].toString())) {
			const windowIdList = events.map(ev => ev[windowId].toString());

			units[logObj[serial]] = units[logObj[serial]].filter(el => {
				return !windowIdList.includes(el);
			});

			if (units[logObj[serial]].length === 0) {
				delete units[logObj[serial]];
				this.watchLists.count--;
			}
		}

		return true;
	}
	//#endregion

	closeBlast(time) {
		if (!this.times.firingComplete) this.times.firingComplete = time;
		this.times.blastClosed = time;
		this.times.blastReturnTime = this.times.blastClosed - this.times.firingComplete;
	}

	setSnapshot(snapshot, position) {
		this.data.snapshots[position] = this.createSnapshot(snapshot).snapShotObj;
	}

	async getBlastReport() {
		return this.data;
	}
}

module.exports = BlastModel;
