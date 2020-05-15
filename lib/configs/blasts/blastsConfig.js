/* eslint-disable no-unused-vars */
const { assign } = require("xstate");
const Timer = require("tiny-timer");

const blastConfig = {
	general: {
		reportTime: 180000, // 3 minutes from end of firing
	},
	fsm: function (timers) {
		return [
			{
				id: "blasting cycle",
				context: { initiate: null, firingComplete: null, blastClosed: null },
				initial: "starting",
				states: {
					starting: {},
					firing: {
						activities: ["firingCountDown"],
						on: {
							FIRING_COMPLETE: { target: "watching", actions: ["fire_complete"] },
							ABORT: { target: "closed", actions: ["abort"] },
						},
					},
					watching: {
						activities: ["reportCountDown"],
						on: {
							DATA_RETURNED: { target: "closed", actions: ["data_complete"] },
							PSEUDO_COMPLETE: { target: "closed", actions: ["pseudo_data_complete"] },
							TIMER_COMPLETE: { target: "closed", actions: ["timer_complete"] },
						},
					},
					closed: { type: "final" },
				},
				on: { FIRING: { target: "firing", actions: ["initialise"] } },
			},
			{
				actions: {
					initialise: assign((context, event) => ({
						initiate: event.createdAt,
						modified: event.createdAt,
					})),
					fire_complete: assign((context, event) => {
						return { firingComplete: event.createdAt, modified: event.createdAt };
					}),
					data_complete: assign((context, event) => ({
						blastClosed: event.createdAt,
						method: "data_completed",
						modified: event.createdAt,
					})),
					pseudo_data_complete: assign((context, event) => ({
						blastClosed: event.createdAt,
						method: "pseudo_data_completed",
						modified: event.createdAt,
					})),
					timer_complete: assign((context, event) => ({
						blastClosed: context.initiate + Object.keys(timers).reduce((a, c) => a + timers[c], 0),
						method: "timer_completed",
						modified: event.createdAt,
					})),
				},
				activities: {
					firingCountDown: () => {
						const firingTimer = new Timer({ stopwatch: false }).on("tick", (ms) => {
							this.emit("timer", { timer: "firing", duration: Math.round(ms / 1000) * 1000 });
						});
						// .on("done", () => {
						// 	this.emit("timer", { timer: "firing", duration: 0 });
						// })
						firingTimer.start(timers.firing);

						return () => {
							firingTimer.stop();
							this.emit("timer", { timer: "firing", duration: 0 });
						};
					},
					reportCountDown: () => {
						const firingTimer = new Timer({ stopwatch: false })
							.on("tick", (ms) => {
								this.emit("timer", { timer: "report", duration: Math.round(ms / 1000) * 1000 });
							})
							.on("done", () => {
								this.emit("timer", { timer: "report", duration: 0 });
								this.state.fsmService.send("TIMER_COMPLETE");
							});
						firingTimer.start(timers.reporting);

						return () => {
							firingTimer.stop();
							this.emit("timer", { timer: "report", duration: 0 });
						};
					},
				},
			},
		];
	},
};

module.exports = blastConfig;
