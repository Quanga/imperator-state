const { assign } = require("xstate");

const fsms = {
	0: [
		{
			parallel: true,
			context: { createdAt: 0, data: {} },
			states: {
				operation: {
					initial: "disarmed",
					states: {
						disarmed: {
							on: {
								ARMING: { target: "armed" },
								ERROR_FIRE: { target: "error_firing" },
							},
						},
						armed: {
							on: { DISARMING: { target: "disarmed" }, FIRING_PRESSED: { target: "firing" } },
						},
						firing: {
							on: {
								FIRING_RELEASED: { target: "firing_complete" },
								FIRING_ABORTED: { target: "firing_aborted" },
							},
							meta: { message: "start_blast" },
						},
						firing_complete: {},
						firing_aborted: {
							after: { 500: { target: "disarmed" } },
						},
						error_firing: {
							after: { 500: { target: "disarmed" } },
						},
					},
				},
				faults: {
					initial: "none",
					states: {
						none: { on: { ERROR: { target: "error" } } },
						error: { on: { RESOLVED: { target: "none" } } },
					},
				},
			},
			on: {
				ARMED: { target: "operation.armed" },
				DISARMED: { target: "operation.disarmed" },
				FIRING: { target: "operation.firing" },
			},
		},
		{ actions: {} },
	],
	3: [
		{
			initial: "active",
			context: { timeOut: 10 * 60 * 1000 },
			states: {
				active: {
					parallel: true,
					states: {
						hist: { type: "history", history: "deep" },
						operation: {
							initial: "disarmed",
							states: {
								disarmed: {
									on: { ARMING: { target: "armed", actions: ["comm_children"] } },
								},
								armed: { on: { DISARMING: { target: "disarmed" } } },
							},
						},
						faults: {
							initial: "none",
							states: {
								none: { on: { ERROR: { target: "error" } } },
								error: { on: { RESTORED: { target: "none" } } },
							},
						},
					},
					after: { COMM_INACTIVE: { target: "inactive", internal: false } },
				},
				inactive: {},
			},
			on: {
				COMM_LOST: { target: "inactive" },
				COMM: { target: "active.hist", internal: false },
				ARMED: { target: "active.operation.armed" },
				DISARMED: { target: "active.operation.disarmed" },
			},
		},
		{
			actions: {
				comm_children: () => this.disconnectChildren(),
			},
			delays: {
				COMM_INACTIVE: context => {
					return context.timeOut;
				},
			},
		},
	],
};

module.exports = fsms;
