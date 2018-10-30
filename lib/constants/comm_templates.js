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
						index: 4
					},
					cable_fault: {
						desc: "Shaft Cable fault",
						val: { 0: "Detected", 1: "Cleared" },
						index: 3
					},
					fire_button: {
						val: { 0: "Pressed", 1: "not Pressed" },
						memo: "Fire button",
						index: 2
					},
					isolation_relay: {
						desc: "IBC-1 Isolation relay",
						val: { 0: "Opened", 1: "Closed" },
						index: 1
					},
					key_switch_status: {
						desc: "IBC-1 Key-switch",
						val: { 0: "Disarmed", 1: "Disarmed" },
						index: 0
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
						index: 4
					},
					cable_fault: {
						desc: "Detonator",
						val: { 0: "Disconnected", 1: "Connected" },
						index: 3
					},
					blast_armed: {
						desc: "ISC-1",
						val: { 0: "Armed", 1: "Disarmed" },
						index: 2
					},
					isolation_relay: {
						desc: "ISC-1 Shaft Isolation relay",
						val: { 0: "Closed", 1: "Open" },
						index: 1
					},
					key_switch_status: {
						desc: "ISC-1 Key-switch",
						val: { 0: "Armed", 1: "Isolated" },
						index: 0
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
						index: 15
					},
					cable_fault: {
						desc: "Cable fault to EDDs",
						val: { 0: "Cleared", 1: "Fault" },
						index: 14
					},
					earth_leakage: {
						desc: "ISC-1 earth leakage fault",
						val: { 0: "Cleared", 1: "Detected" },
						index: 13
					},
					mains: {
						desc: "Mains",
						val: { 0: "Cleared", 1: "Detected" },
						index: 12
					},
					shaft_fault: {
						desc: "Shaft cable fault",
						val: { 0: "Cleared", 1: "Detected" },
						index: 11
					},
					DC_supply_voltage_status: {
						desc: "Shaft earth leakage fault",
						val: { 0: "Clear", 1: "Detected" },
						index: 10
					},
					low_bat: {
						desc: "Low Battery",
						val: { 0: "Clear", 1: "Detected" },
						index: 9
					},
					too_low_bat: {
						memo: "Battery too Low",
						val: { 0: "Detected", 1: "Cleared" },
						index: 8
					},
					blast_armed: {
						desc: "CCB",
						val: { 0: "Ready for Blast", 1: "Not Ready" },
						index: 7
					},
					partial_blast_lfs: {
						desc: "Detonator Error",
						val: { 0: "Detected", 1: "Cleared" },
						index: 6
					},
					isolation_relay: {
						desc: "AB-1 Shaft Isolation relay",
						val: { 0: "Opened", 1: "Closed" },
						index: 5
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
					detonator_status: {
						desc: "EDD",
						val: { 0: "connected", 1: "not connected" },
						index: 1
					},
					bridge_wire: {
						desc: "EDD Bridge Wire Resistance",
						val: { 0: "no_partial_blast", 1: "mains_present_for_more_than_5s" },
						index: 2
					},
					energy_storing: {
						desc: "EDD energy",
						val: { 0: "not stored", 1: "stored" },
						index: 3
					},
					tagged: {
						desc: "EDD",
						val: { 0: "not tagged", 1: "tagged" },
						index: 4
					},
					booster_fired_lfs: {
						desc: "EDD",
						val: { 0: "fired", 1: "not fired" },
						index: 5
					},
					calibration: {
						desc: "EDD",
						val: { 0: "not Calibrated", 1: "Calibrated" },
						index: 6
					},
					program: {
						desc: "EDD",
						val: { 0: "not Programmed", 1: "Programmed" },
						index: 7
					}
				}
			}
		};
	}
}

module.exports = IncomingCommTemplate;
