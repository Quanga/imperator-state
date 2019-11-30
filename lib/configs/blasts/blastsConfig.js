/* eslint-disable no-unused-vars */
const { assign } = require("xstate");

const blastConfig = {
	general: {
		reportTime: 180000, // 3 minutes from end of firing
	},
	fsm: {
		id: "blasting cycle",
		context: { createdAt: 0 },
		initial: "starting",
		states: {
			starting: {
				entry: [
					(context, event) =>
						console.log(`After: ${JSON.stringify(context)}\nAfter: ${JSON.stringify(event)}`),
				],
			},
			firing: {
				activities: ["firingCountDown"],
				on: {
					FIRING_COMPLETE: {
						target: "watching",
						actions: ["update", (c, e) => console.log("EEEEEEe", e)],
					},
					ABORT: { target: "cancelling", actions: ["update", "test"] },
				},
			},
			watching: {
				activities: ["reportCountDown"],
				entry: [
					"update",
					() => console.log("FIRING COMPLETE"),
					() => console.log("WAITING FOR TIMER OR DATA COMPLETE"),
				],
				on: {
					DATA_RETURNED: { target: "data_complete", actions: ["update"] },
					PSEUDO: { target: "pseudo_complete", actions: ["update", "test"] },
				},

				// after: {
				// 	2000: {
				// 		target: "timer_complete",
				// 		actions: [
				// 			assign((context, event) => ({
				// 				closed: "data_complete",
				// 			})),
				// 		],
				// 	},
				// },
			},
			cancelling: { on: { "": { target: "closed" } } },
			timer_complete: {
				entry: [() => console.log("TIMER IS COMPLETED")],

				on: { "": { target: "closed" } },
			},
			data_complete: {
				after: {
					"": {
						target: "closed",
						actions: [
							assign((context, event) => ({
								closed: "data_complete",
							})),
						],
					},
				},
			},
			pseudo_complete: {
				on: {
					"": {
						target: "closed",
						actions: [
							assign((context, event) => ({
								closed: "data_complete",
							})),
						],
					},
				},
			},
			closed: {
				type: "final",
				onDone: {
					actions: ["update"],
				},
			},
		},
		on: {
			FIRING: { target: "firing", actions: ["update"] },
			TIMER_COMPLETE: { target: "timer_complete" },
		},
	},
};

module.exports = blastConfig;
