/* eslint-disable no-unused-vars */
const EventEmitter = require("events").EventEmitter;
const { Machine, interpret } = require("xstate");

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
		this.fsm = Machine(fsm);
		this.fsmService = interpret(this.fsm).onTransition(state => {
			if (state.changed) {
				this.currentState = state;
				this.emit("state", state.value);
			}
		});

		this.fsmService.start();
		return this;
	}

	withState(nState) {
		if (nState) {
			const { states } = this;

			const stateKeys = Object.keys(states);

			let done;

			stateKeys.forEach(sKey => {
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
		}

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

	withTimeOut(duration) {
		if (!this.commTimeout) {
			this.commTimeout = duration;
		}

		this.timer = setTimeout(() => {
			console.log("::::::::::: COMMS ARE LOST :::::::::::::");
			this.fsmService.send("COMM_LOST");
		}, this.commTimeout);
	}

	setLastCommunication(timeStamp) {
		if (this.timer) {
			console.log("____________ COMMS RESET _____________");
			clearTimeout(this.timer);
			this.fsmService.send("COMM");
		}

		this.withTimeOut();
	}

	getState() {
		if (!Object.prototype.hasOwnProperty.call(this.currentState, "value")) return null;

		return this.currentState.value;
	}
}

module.exports = UnitFSM;
