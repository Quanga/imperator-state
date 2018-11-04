class IncomingCommTemplate {
	constructor() {}

	get incomingCommTemplate() {
		return {
			1: {
				binary: 0b00000001,
				parser: "deviceList",
				payload: {
					primary: {
						typeId: 0,
						parentTypeId: null
					},
					secondary: {
						typeId: 1,
						parentTypeId: 0,
						chunkSize: 4
					}
				}
			},
			2: {
				binary: 0b000000010,
				parser: "deviceList",
				payload: {
					primary: {
						typeId: 1,
						parentTypeId: 0
					},
					secondary: {
						typeId: 2,
						parentTypeId: 1,
						chunkSize: 4
					}
				}
			},
			3: {
				binary: 0b00000011,
				parser: "deviceData",
				payload: {
					primary: {
						typeId: 1,
						parentTypeId: 0,
						bitTemplate: this.unitBitTemplate[1]
					},
					secondary: {
						typeId: 2,
						parentTypeId: 1,
						bitTemplate: this.unitBitTemplate[2],
						chunkSize: 4
					}
				}
			},
			4: {
				binary: 0b00000001,
				parser: "deviceList",
				payload: {
					primary: {
						typeId: 3,
						parentTypeId: 0
					},
					secondary: {
						typeId: 4,
						parentTypeId: 3,
						chunkSize: 10
					}
				}
			},
			5: {
				binary: 0b00000101,
				parser: "deviceData",
				payload: {
					primary: {
						typeId: 3,
						parentTypeId: 0,
						bitTemplate: this.unitBitTemplate[3]
					},
					secondary: {
						typeId: 4,
						parentTypeId: 3,
						bitTemplate: this.unitBitTemplate[4],
						chunkSize: 8
					}
				}
			},
			8: {
				binary: 0b00001000,
				parser: "deviceData",
				payload: {
					primary: {
						typeId: 0,
						parentTypeId: null,
						bitTemplate: this.unitBitTemplate[0]
					},

					secondary: null
				}
			}
		};
	}

	get unitBitTemplate() {
		return {
			0: {
				device_type: 0,
				parent_type: 0,
				bits: {
					unused_1: { val: 0, desc: "unused", index: 7 },
					blast_armed: { val: 0, desc: "unused", index: 6 },
					unused_3: { val: 0, desc: "unused", index: 5 },
					earth_leakage: {
						desc: "Shaft earth leakage fault",
						val: { 0: "Cleared", 1: "Detected" },
						index: 4,
						flags: ["log", "warning"]
					},
					cable_fault: {
						desc: "Shaft Cable fault",
						val: { 0: "Detected", 1: "Cleared" },
						index: 3,
						flags: ["log", "warning"]
					},
					fire_button: {
						desc: "Fire button",
						val: { 0: "Pressed", 1: "not Pressed" },
						index: 2,
						flags: ["log"]
					},
					isolation_relay: {
						desc: "IBC-1 Isolation relay",
						val: { 0: "Opened", 1: "Closed" },
						index: 1,
						flags: ["log"]
					},
					key_switch_status: {
						desc: "IBC-1 Key-switch",
						val: { 0: "Disarmed", 1: "Disarmed" },
						index: 0,
						flags: ["log"]
					}
				}
			},
			1: {
				bits: {
					unused_1: { default: 0, desc: "unused", index: 7 },
					unused_2: { default: 0, desc: "unused", index: 6 },
					unused_3: { default: 0, desc: "unused", index: 5 },
					earth_leakage: {
						desc: "ISC-1 earth leakage fault",
						val: { 0: "Cleared", 1: "Detected" },
						index: 4,
						flags: ["log", "warning"]
					},
					cable_fault: {
						desc: "Detonator",
						val: { 0: "Disconnected", 1: "Connected" },
						index: 3,
						flags: ["log", "warning"]
					},
					blast_armed: {
						desc: "ISC-1",
						val: { 0: "Armed", 1: "Disarmed" },
						index: 2,
						flags: ["log"]
					},
					isolation_relay: {
						desc: "ISC-1 Shaft Isolation relay",
						val: { 0: "Closed", 1: "Open" },
						index: 1,
						flags: ["log"]
					},
					key_switch_status: {
						desc: "ISC-1 Key-switch",
						val: { 0: "Armed", 1: "Isolated" },
						index: 0,
						flags: ["log", "warning"]
					}
				}
			},
			2: {
				bits: {
					unused_1: { default: 0, desc: "unused", index: 7 },
					missing_pulse_detected_lfs: {
						desc: "25th pulse",
						val: { 0: "not Removed", 1: "Removed" },
						index: 6
					},
					partial_blast_lfs: {
						desc: "IB651 partial blast",
						val: { 0: "not Detected", 1: "Detected" },
						index: 5
					},
					booster_fired_lfs: {
						desc: "IB651",
						val: { 0: "did not Fire", 1: "Fired" },
						index: 4
					},
					mains: {
						desc: "Mains",
						val: {
							0: "present for less than 15s",
							1: "present for more than 15s"
						},
						index: 3
					},
					detonator_status: {
						desc: "IB651 Detonator",
						val: { 0: "Disconnected", 1: "Connected" },
						index: 2
					},
					key_switch_status: {
						desc: "IB651 Key-switch",
						val: { 0: "Disarmed", 1: "Armed" },
						index: 1
					},
					DC_supply_voltage: {
						desc: "IB651 DC supply voltage",
						val: { 0: "Low", 1: "Normal" },
						index: 0
					}
				}
			},
			3: {
				bits: {
					key_switch_status: {
						desc: "CCB Key-switch",
						val: { 0: "Off", 1: "On" },
						index: 15,
						flags: ["log"]
					},
					cable_fault: {
						desc: "Cable fault to EDDs",
						val: { 0: "Cleared", 1: "Fault" },
						index: 14,
						flags: ["log", "warning"]
					},
					earth_leakage: {
						desc: "ISC-1 earth leakage fault",
						val: { 0: "Cleared", 1: "Detected" },
						index: 13,
						flags: ["log", "warning"]
					},
					mains: {
						desc: "Mains",
						val: { 0: "Cleared", 1: "Detected" },
						index: 12,
						flags: ["log", "warning"]
					},
					shaft_fault: {
						desc: "Shaft cable fault",
						val: { 0: "Cleared", 1: "Detected" },
						index: 11,
						flags: ["log", "warning"]
					},
					DC_supply_voltage_status: {
						desc: "Shaft earth leakage fault",
						val: { 0: "Clear", 1: "Detected" },
						index: 10,
						flags: ["log", "warning"]
					},
					low_bat: {
						desc: "Low Battery",
						val: { 0: "Clear", 1: "Detected" },
						index: 9,
						flags: ["log", "warning"]
					},
					too_low_bat: {
						desc: "Battery too Low",
						val: { 0: "Detected", 1: "Cleared" },
						index: 8,
						flags: ["log", "warning"]
					},
					blast_armed: {
						desc: "CCB",
						val: { 0: "Ready for Blast", 1: "Not Ready" },
						index: 7,
						flags: ["log"]
					},
					partial_blast_lfs: {
						desc: "Detonator Error",
						val: { 0: "Detected", 1: "Cleared" },
						index: 6,
						flags: ["log"]
					},
					isolation_relay: {
						desc: "CBB Shaft Isolation relay",
						val: { 0: "Opened", 1: "Closed" },
						index: 5,
						flags: ["log", "warning"]
					},
					unused_1: { val: 0, desc: "unused", index: 4 },
					unused_2: { val: 0, desc: "unused", index: 3 },
					unused_3: { val: 0, desc: "unused", index: 2 },
					unused_4: { val: 0, desc: "unused", index: 1 },
					unused_5: { val: 0, desc: "unused", index: 0 }
				}
			},
			4: {
				bits: {
					unused_1: { default: 0, desc: "unused", index: 0 },
					bridge_wire: {
						desc: "Bridge Wire Resistance",
						val: { 0: "fine", 1: "high" },
						index: 1
					},
					calibration: {
						desc: "EDD",
						val: { 0: "Calibrated", 1: "not Calibrated" },
						index: 2
					},
					program: {
						desc: "EDD",
						val: { 0: "programmed", 1: "not programmed" },
						index: 3
					},
					booster_fired_lfs: {
						desc: "EDD",
						val: { 0: "did not fire", 1: "fired" },
						index: 4
					},
					tagged: {
						desc: "EDD",
						val: { 0: "not tagged", 1: "tagged" },
						index: 5
					},
					detonator_status: {
						desc: "EDD",
						val: { 0: "not connected", 1: "Connected" },
						index: 6
					},
					logged: {
						desc: "EDD",
						val: { 0: "not Logged", 1: "Logged" },
						index: 7
					}
				}
			}
		};
	}

	get loggables() {
		return {
			communication_status: {},
			key_switch_status: {},
			fire_button: {},
			isolation_relay: {},
			DC_supply_voltage_status: {},
			cable_fault: {},
			earth_leakage: {},
			booster_fired_lfs: {},
			mains: {},
			low_bat: {}
		};
	}

	get warnables() {
		return {
			cable_fault: {
				0: "Cable fault detected, unit will not fire until the fault is isolated or corrected",
				1: "Cable fault to EDDs detected, will not fire any EDDs"
			},
			earth_leakage: {
				0: "Earth leakage fault detected, unit will not fire until fault is isolated or corrected",
				1: "Section earth leakage fault detected, downstream units isolated and will not fire until fault is isolated or corrected"
			},
			booster_fired_lfs: {},
			mains: { 0: "Power outage, unit operating on battery backup" },
			low_bat: {
				0: "Low battery detected, failure to charge may result in blast failure. There is 1 hour left until the battery is depleted"
			}
		};
	}
}

module.exports = IncomingCommTemplate;
