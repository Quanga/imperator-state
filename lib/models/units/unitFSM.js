/* eslint-disable no-prototype-builtins */
/* eslint-disable no-unused-vars */
const EventEmitter = require("events").EventEmitter;
const { Machine, interpret } = require("xstate");
const equal = require("deep-equal");

class UnitFSM extends EventEmitter {
	constructor() {
		super();
		this.currentState = {};
	}

	static create() {
		const unitFSM = new UnitFSM();
		return unitFSM;
	}

	withFSM(fsm) {
		this.fsm = Machine(...fsm);

		return this;
	}

	start() {
		this.fsmService = interpret(this.fsm)
			.onTransition(state => {
				if (state.changed) {
					if (!equal(state.value, this.currentState)) {
						this.currentState = state.value;
						this.emit("state", state.value);
					}
				}
			})
			.start();

		this.currentState = this.fsmService.state.value;
		return this;
	}

	withState(nState) {
		if (!nState) throw new Error("State must be supplied");

		const { states } = this;

		let done;

		Object.keys(states).forEach(sKey => {
			let nextKeys, nextResult;

			if (!done) {
				nextKeys = Object.keys(states[sKey]);
				nextResult = nextKeys.filter(nextKey => states[sKey][nextKey] === nState[nextKey]);

				if (nextResult.length === nextKeys.length) {
					this.fsmService.send(sKey);
					done = true;
				}
			}
		});

		return this;
	}

	withTriggers(opts) {
		this.triggers = opts.events;
		this.states = opts.states;

		return this;
	}

	toggleState(pState, nState) {
		const { triggers } = this;
		const triggerKeys = Object.keys(triggers);
		this.fsmService.send("COMM");

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
						done = true;
						return this.fsmService.send(triggerKey);
					}
				}
			}
		});
	}

	setLastCommunication(timeStamp) {
		this.fsmService.send("COMM");
	}

	getState() {
		if (!Object.prototype.hasOwnProperty.call(this, "currentState")) return null;

		return this.currentState;
	}
}

module.exports = UnitFSM;