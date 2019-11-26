const fsms = {
	0: [
		{
			parallel: true,
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
								FIRING_COMPLETE: { target: "firing_complete" },
								FIRING_ABORTED: { target: "firing_aborted" },
							},
						},
						firing_complete: {
							after: { 500: { target: "disarmed" } },
						},
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
	],
	3: [
		{
			initial: "active",
			states: {
				active: {
					parallel: true,
					states: {
						hist: {
							type: "history",
							history: "deep",
						},
						operation: {
							initial: "disarmed",
							states: {
								disarmed: {
									on: {
										ARMING: { target: "armed" },
									},
								},
								armed: {
									on: { DISARMING: { target: "disarmed" } },
								},
							},
						},
						faults: {
							initial: "none",
							states: {
								none: {
									on: { ERROR: { target: "error" } },
								},
								error: {
									on: { RESTORED: { target: "none" } },
								},
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
			delays: {
				// eslint-disable-next-line no-unused-vars
				COMM_INACTIVE: (context, event) => {
					return 10 * 60 * 1000;
				},
			},
		},
	],
};

module.exports = fsms;
