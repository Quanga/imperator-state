class IncomingCommTemplate {
	constructor() { }

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
				bits: {
					unused_1: { index: 7 },
					blast_armed: { index: 6 },
					unused_3: { index: 5 },
					earth_leakage: { index: 4 },
					cable_fault: { index: 3 },
					fire_button: { index: 2 },
					isolation_relay: { index: 1 },
					key_switch_status: { index: 0 }
				}
			},
			1: {
				bits: {
					unused_1: { index: 7 },
					unused_2: { index: 6 },
					unused_3: { index: 5 },
					earth_leakage: { index: 4 },
					cable_fault: { index: 3 },
					blast_armed: { index: 2 },
					isolation_relay: { index: 1 },
					key_switch_status: { index: 0 }
				}
			},
			2: {
				bits: {
					unused_1: { index: 7 },
					missing_pulse_detected_lfs: { index: 6 },
					partial_blast_lfs: { index: 5 },
					booster_fired_lfs: { index: 4 },
					mains: { index: 3 },
					detonator_status: { index: 2 },
					key_switch_status: { index: 1 },
					DC_supply_voltage: { index: 0 }
				}
			},
			3: {
				bits: {
					key_switch_status: { index: 15 },
					cable_fault: { index: 14 },
					earth_leakage: { index: 13 },
					mains: { index: 12 },
					shaft_fault: { index: 11 },
					DC_supply_voltage_status: { index: 10 },
					low_bat: { index: 9 },
					too_low_bat: { index: 8 },
					blast_armed: { index: 7 },
					partial_blast_lfs: { index: 6 },
					isolation_relay: { index: 5 },
					unused_1: { index: 4 },
					unused_2: { index: 3 },
					unused_3: { index: 2 },
					unused_4: { index: 1 },
					unused_5: { index: 0 }
				}
			},
			4: {
				bits: {
					unused_1: { index: 0 },
					bridge_wire: { index: 1 },
					calibration: { index: 2 },
					program: { index: 3 },
					booster_fired_lfs: { index: 4 },
					tagged: { index: 5 },
					detonator_status: { index: 6 },
					logged: { index: 7 }
				}
			}
		};
	}

	get loggableTypes() {
		return {
			0: "Control Unit",
			1: "ISC",
			2: "I651",
			3: "CBB",
			4: "EDD"
		};
	}

	get loggables() {
		return {
			blast_armed: {
				default: {
					0: (serial, type) =>
						`${this.loggableTypes[type]}: SN ${serial} Blast Disarmed`,
					1: (serial, type) =>
						`${this.loggableTypes[type]}: SN ${serial} Blast Armed`
				}
			},
			communication_status: {
				default: {
					0: (serial, type) =>
						`${
							this.loggableTypes[type]
						}: SN ${serial} communication status is OFF`,
					1: (serial, type) =>
						`${
							this.loggableTypes[type]
						}: SN ${serial} communication status is ON`
				}
			},
			key_switch_status: {
				default: {
					0: (serial, type) =>
						`${this.loggableTypes[type]}: SN ${serial} key Switch is OFF`,
					1: (serial, type) =>
						`${this.loggableTypes[type]}: SN ${serial} key Switch is ON`
				}
			},
			fire_button: {
				0: {
					0: (serial, type) =>
						`${this.loggableTypes[type]}: SN ${serial} key switch not Pressed`,
					1: (serial, type) =>
						`${this.loggableTypes[type]}: SN ${serial} key switch Pressed`
				}
			},
			isolation_relay: {
				default: {
					0: (serial, type) =>
						`${this.loggableTypes[type]}: SN ${serial} isolation relay is OFF`,
					1: (serial, type) =>
						`${this.loggableTypes[type]}: SN ${serial} isolation relay is ON`
				}
			},
			DC_supply_voltage_status: {
				default: {
					0: (serial, type) =>
						`${
							this.loggableTypes[type]
						}: SN ${serial} DC_supply_voltage_status is OFF`,
					1: (serial, type) =>
						`${
							this.loggableTypes[type]
						}: SN ${serial} DC_supply_voltage_status is ON`
				}
			},
			cable_fault: {
				default: {
					0: (serial, type) =>
						`${this.loggableTypes[type]}: SN ${serial} No Cable Fault Detected`,
					1: (serial, type) =>
						`${this.loggableTypes[type]}: SN ${serial} Cable Fault Detected`
				}
			},
			earth_leakage: {
				default: {
					0: (serial, type) =>
						`${this.loggableTypes[type]}: SN ${serial} No Earth Leakage Fault`,
					1: (serial, type) =>
						`${
							this.loggableTypes[type]
						}: SN ${serial} Earth Leakage Fault Detected`
				}
			},
			booster_fired_lfs: {
				default: {
					0: (serial, type) =>
						`${
							this.loggableTypes[type]
						}: SN ${serial} booster fire message false`,
					1: (serial, type) =>
						`${
							this.loggableTypes[type]
						}: SN ${serial} booster fire message true`
				}
			},
			mains: {
				default: {
					0: (serial, type) =>
						`${this.loggableTypes[type]}: SN ${serial} Power Supply Connected`,
					1: (serial, type) =>
						`${this.loggableTypes[type]}: SN ${serial} Power Supply Error`
				}
			},
			low_bat: {
				default: {
					0: (serial, type) =>
						`${this.loggableTypes[type]}: SN ${serial} Battery Charged`,
					1: (serial, type) =>
						`${this.loggableTypes[type]}: SN ${serial} Low Battery Detected`
				}
			}
		};
	}

	get warnables() {
		return {
			cable_fault: {
				default: {
					0: (serial, type) =>
						`${this.loggableTypes[type]}: SN ${serial} : Cable fault Restored`,
					1: (serial, type) =>
						`${
							this.loggableTypes[type]
						}: SN ${serial} : Cable fault detected, unit will not fire until the fault is isolated or corrected`
				},
				3: {
					0: (serial, type) =>
						`${this.loggableTypes[type]}: SN ${serial} : Cable fault Restored`,
					1: (serial, type) =>
						`${
							this.loggableTypes[type]
						}: SN ${serial} : Cable fault to EDDs detected, will not fire any EDDs`
				}
			},
			earth_leakage: {
				default: {
					0: (serial, type) =>
						`${
							this.loggableTypes[type]
						}: SN ${serial} Earth leakage fault corrected`,
					1: (serial, type) =>
						`${
							this.loggableTypes[type]
						}: SN ${serial} : Earth leakage fault detected, unit will not fire until fault is isolated or corrected`
				},
				1: {
					0: (serial, type) =>
						`${
							this.loggableTypes[type]
						}: SN ${serial} Earth leakage fault corrected`,
					1: (serial, type) =>
						`${
							this.loggableTypes[type]
						}: SN ${serial} : Section earth leakage fault detected, downstream units isolated and will not fire until fault is isolated or corrected`
				},
				3: {
					0: (serial, type) =>
						`${
							this.loggableTypes[type]
						}: SN ${serial} Earth leakage fault corrected`,
					1: (serial, type) =>
						`${
							this.loggableTypes[type]
						}: SN ${serial} : Section earth leakage fault detected, downstream units isolated and will not fire until fault is isolated or corrected`
				}
			},
			booster_fired_lfs: {
				default: {
					0: (serial, type) =>
						`${this.loggableTypes[type]}: SN ${serial} booster not fired`,
					1: (serial, type) =>
						`${this.loggableTypes[type]}: SN ${serial} booser fired message`
				}
			},
			mains: {
				default: {
					0: (serial, type) =>
						`${this.loggableTypes[type]}: SN ${serial} : Power Restored`,
					1: (serial, type) =>
						`${
							this.loggableTypes[type]
						}: SN ${serial} : Power outage, unit operating on battery backup`
				}
			},
			low_bat: {
				default: {
					0: (serial, type) =>
						`${this.loggableTypes[type]}: SN ${serial} Battery Restored`,
					1: (serial, type) =>
						`${
							this.loggableTypes[type]
						}: SN ${serial} : Low battery detected, failure to charge may result in blast failure. There is 1 hour left until the battery is depleted`
				}
			}
		};
	}
}

module.exports = IncomingCommTemplate; 
