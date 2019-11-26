const blastConfig = {
	general: {
		reportTime: 180000, // 3 minutes from end of firing
	},
	fsm: {
		id: "blasting cycle",
		initial: "starting",
		states: {
			starting: {
				after: {
					200: { target: "firing" },
				},
			},
			firing: {
				on: {
					FIRING_COMPLETE: "watching",

					ABORT: "cancelling",
				},
			},
			watching: {
				on: {
					DATA_RETURNED: "data_complete",
					PSEUDO: { target: "pseudo_complete" },
				},
				after: { 2000: { target: "timer_complete" } },
			},
			cancelling: { after: { 1000: { target: "closed" } } },
			timer_complete: { after: { 1000: { target: "closed" } } },
			data_complete: { after: { 1000: { target: "closed" } } },
			pseudo_complete: { after: { 1000: { target: "closed" } } },
			closed: {
				type: "final",
				onDone: {
					actions: "renderReport",
				},
			},
		},

		actions: {
			// action implementations
			activate: (context, event) => {
				console.log("activating...", event);
			},
		},
	},
};

module.exports = blastConfig;
