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
							entry: [() => console.log("CCB DISARMED")],
							on: {
								ARMING: { target: "armed" },
								ERROR_FIRE: { target: "error_firing" },
							},
						},
						armed: {
							entry: [() => console.log("CCB ARMED")],
							on: { DISARMING: { target: "disarmed" }, FIRING_PRESSED: { target: "firing" } },
						},
						firing: {
							entry: [() => console.log("CCB FIRING")],
							on: {
								FIRING_RELEASED: { target: "firing_complete" },
								FIRING_ABORTED: { target: "firing_aborted" },
							},
							meta: {
								message: "start_blast",
							},
						},
						firing_complete: {
							entry: [() => console.log("CBB FIRING COMPLETE")],
						},
						firing_aborted: {
							entry: [() => console.log("CBB FIRING ABORTED")],

							after: { 500: { target: "disarmed" } },
						},
						error_firing: {
							entry: [() => console.log("CBB FIRING ERROR")],

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
