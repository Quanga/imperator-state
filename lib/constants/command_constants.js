/**
 * Created by grant on 2016/06/27.
 */


var CommandConstants = function () {
};

Object.defineProperty(CommandConstants.prototype, 'ibcToPiCommands', {

	get: function () {

		/*
         NOTE: bit ordering is important! The index field here is used for sorting, but the MSB is OPPOSITE.
         ie: bit 0 is LSB and bit 7 is MSB.

         Bit numbering:
         ==============
         LSB = 0 (little endian) - ie: bit 7 = MSB, bit 0 = LSB, where bit 0 is the 'right-most' bit.
         */

		return {
			0b00000001: {
				command_id: 0b00000001,
				serial_type: 0b000, // the serial field contains the device id of the IBC-1
				parent_type: 0b000,
				data: {
					data_type: 'serial_list',
					first_byte: {
						read_type: 'byte',
						device_type: 0b001,
						parent_type: 0b000,
						bits: null
					},
					remaining_bytes: {
						read_type: 'byte',
						device_type: 0b001,
						parent_type: 0b000,
						bits: null
					}
				}
			},
			0b000000010: {
				command_id: 0b000000010,
				serial_type: 0b001, // the serial field contains the device id of the ISC-1
				parent_type: 0b000,
				data: {
					data_type: 'serial_list',
					first_byte: {
						read_type: 'byte',
						device_type: 0b010,
						parent_type: 0b001,
						bits: null
					},
					remaining_bytes: {
						read_type: 'byte',
						device_type: 0b010,
						parent_type: 0b001,
						bits: null
					}
				}
			},
			0b00000011: {
				command_id: 0b00000011,
				serial_type: 0b001, // the serial field contains the device id of the ISC-1
				parent_type: 0b000,
				data: {
					data_type: 'data_list',
					first_byte: {
						read_type: 'bit',
						device_type: 0b001, // ISC
						bits: {
							unused_1: {default: 0, memo: 'unused', index: 7},
							unused_2: {default: 0, memo: 'unused', index: 6},
							unused_3: {default: 0, memo: 'unused', index: 5},
							earth_leakage: {
								no_fault: 0,
								fault: 1,
								memo: 'ISC-1 earth leakage fault',
								index: 4,
								true: 'Detected',
								false: 'Cleared'
							},
							cable_fault: {
								no_fault: 0,
								fault: 1,
								memo: 'Detonator',
								index: 3,
								true: 'Connected',
								false: 'Disconnected'
							},
							blast_armed: {
								disarmed: 0,
								armed: 1,
								memo: 'ISC-1',
								index: 2,
								true: 'Armed for Blast',
								false: 'Disarmed'
							},
							isolation_relay: {
								open: 0,
								closed: 1,
								memo: 'ISC-1 Shaft Isolation relay',
								index: 1,
								true: 'Opened',
								false: 'Closed'
							},
							key_switch_status: {
								disarm: 0,
								arm: 1,
								memo: 'ISC-1 Key-switch',
								index: 0,
								false: 'Armed',
								true: 'Isolated'
							}
						}
					},
					remaining_bytes: {
						read_type: 'bit',
						device_type: 0b010, // IB651
						parent_type: 0b001,
						bits: {
							unused_1: {default: 0, memo: 'unused', index: 7},
							// pulse_25_removed: {not_removed: 0, removed: 1, memo: '25th pulse removed', index: 6},
							missing_pulse_detected_lfs: {
								not_removed: 0,
								removed: 1,
								memo: '25th pulse',
								index: 6,
								true: 'Removed',
								false: 'not Removed'
							},
							partial_blast_lfs: {
								no_partial_blast: 0,
								mains_present_for_more_than_5s: 1,
								memo: 'IB651 partial blast',
								index: 5,
								true: 'Detected',
								false: 'not Detected'
							},
							booster_fired_lfs: {
								booster_did_not_fire: 0,
								booster_fired: 1,
								memo: 'IB651',
								index: 4,
								true: 'Fired',
								false: 'did not Fire'
							},
							mains: {
								not_present: 0,
								present_for_more_than_15s: 1,
								memo: 'Mains',
								index: 3,
								true: 'present for more than 15s',
								false: 'present for less than 15s'
							},
							detonator_status: {
								not_connected: 0,
								connected: 1,
								memo: 'IB651 Detonator',
								index: 2,
								true: 'Connected',
								false: 'Disconnected'
							},
							key_switch_status: {
								disarm: 0,
								arm: 1,
								memo: 'IB651 Key-switch',
								index: 1,
								true: 'Armed',
								false: 'Disarmed'
							},
							DC_supply_voltage: {
								wrong: 0,
								OK: 1,
								memo: 'IB651 DC supply voltage',
								index: 0,
								true: 'Low',
								false: 'Normal'
							}
						}
					}
				}
			},
			0b00000100: {
				command_id: 0b00000100,
				serial_type: 0b011,
				parent_type: 0b000,
				data: {
					data_type: 'uid_list',
					first_byte: {
						read_type: 'byte',
						device_type: 0b100,
						parent_type: 0b000,
						bits: null,
						multiplier: 0.20
					},
					remaining_bytes: {
						read_type: 'byte',
						device_type: 0b100,
						parent_type: 0b011,
						bits: null,
						multiplier: 0.20
					}
				}
			},
			0b00000101: {
				command_id: 0b00000101,
				serial_type: 0b001,
				parent_type: 0b000,
				data: {
					data_type: 'uid_data_list',
					first_byte: {
						read_type: 'bit',
						device_type: 0b011,
						parent_type: 0b000,
						bits: {
							key_switch_status: {
								disarm: 0,
								arm: 1,
								memo: 'AB-1 Key-switch',
								index: 15,
								false: 'On',
								true: 'Off'
							},
							cable_fault: {
								no_fault: 0,
								fault: 1,
								memo: 'Cable fault to EDDs',
								index: 14,
								true: 'Detected',
								false: 'Cleared'
							},
							earth_leakage: {
								no_fault: 0,
								fault: 1,
								memo: 'ISC-1 earth leakage fault',
								index: 13,
								true: 'Detected',
								false: 'Cleared'
							},
							mains: {
								no_fault: 0,
								fault: 1,
								memo: 'Mains',
								index: 12,
								true: 'Detected',
								false: 'Cleared'
							},
							shaft_fault: {
								no_fault: 0,
								fault: 1,
								memo: 'Shaft cable fault',
								index: 11,
								true: 'Detected',
								false: 'Cleared'
							},
							DC_supply_voltage_status: {
								no_fault: 0,
								fault: 1,
								memo: 'Shaft earth leakage fault',
								index: 10,
								true: 'Detected',
								false: 'Cleared'
							},
							low_bat: {
								no_fault: 0,
								fault: 1,
								memo: 'Low Battery',
								index: 9,
								true: 'Detected',
								false: 'Cleared'
							},
							too_low_bat: {
								no_fault: 0,
								fault: 1,
								memo: 'Battery too Low',
								index: 8,
								true: 'Detected',
								false: 'Cleared'
							},
							blast_armed: {
								disarmed: 0,
								armed: 1,
								memo: 'AB-1',
								index: 7,
								true: 'Ready for Blast',
								false: 'Not Ready'
							},
							partial_blast_lfs: {
								no_fault: 0,
								fault: 1,
								memo: 'Detonator Error',
								index: 6,
								true: 'Detected',
								false: 'Cleared'
							},
							isolation_relay: {
								open: 0,
								closed: 1,
								memo: 'AB-1 Shaft Isolation relay',
								index: 5,
								true: 'Opened',
								false: 'Closed'
							},
							unused_1: {default: 0, memo: 'unused', index: 4},
							unused_2: {default: 0, memo: 'unused', index: 3},
							unused_3: {default: 0, memo: 'unused', index: 2},
							unused_4: {default: 0, memo: 'unused', index: 1},
							unused_5: {default: 0, memo: 'unused', index: 0}
						}
					},
					remaining_bytes: {
						read_type: 'bit',
						device_type: 0b100,
						parent_type: 0b011,
						bits: {
							unused_1: {default: 0, memo: 'unused', index: 0},
							detonator_status: {
								not_removed: 0,
								removed: 1,
								memo: 'EDD',
								index: 1,
								true: 'connected',
								false: 'not connected'
							},
							bridge_wire: {
								no_partial_blast: 0,
								mains_present_for_more_than_5s: 1,
								memo: 'EDD Bridge Wire Resistance',
								index: 2,
								true: 'high',
								false: 'fine'
							},
							energy_storing: {
								booster_did_not_fire: 0,
								booster_fired: 1,
								memo: 'EDD energy',
								index: 3,
								true: 'stored',
								false: 'not stored'
							},
							tagged: {
								not_present: 0,
								present_for_more_than_15s: 1,
								memo: 'EDD',
								index: 4,
								true: 'tagged',
								false: 'not tagged'
							},
							booster_fired_lfs: {
								not_connected: 0,
								connected: 1,
								memo: 'EDD',
								index: 5,
								true: 'fired',
								false: 'not fired'
							},
							calibration: {
								disarm: 0,
								arm: 1,
								memo: 'EDD',
								index: 6,
								true: 'Calibrated',
								false: 'not Calibrated'
							},
							program: {
								wrong: 0,
								OK: 1,
								memo: 'EDD',
								index: 7,
								true: 'programmed',
								false: 'not programmed'
							}
						}
					}
				}
			},
			0b00000110: {
				command_id: 0b00000110,
				serial_type: 0b001,
				parent_type: 0b000,
				data: {
					data_type: 'data_list',
					first_byte: {
						read_type: 'byte',
						device_type: 0b001,
						parent_type: 0b000,
						bits: null
					},
					remaining_bytes: {
						read_type: 'byte',
						device_type: 0b010,
						parent_type: 0b001,
						bits: null
					}
				}
			},
			0b00000111: {
				command_id: 0b00000111,
				serial_type: 0b001,
				parent_type: 0b000,
				data: {
					data_type: 'data',
					first_byte: {
						read_type: 'byte',
						device_type: 0b001,
						parent_type: 0b000,
						bits: null
					},
					remaining_bytes: null
				}
			},
			0b00001000: {
				command_id: 0b00001000,
				serial_type: 0b000,
				parent_type: 0b000,
				data: {
					data_type: 'data',
					first_byte: {
						read_type: 'bit',
						device_type: 0b000,
						parent_type: 0b000,
						bits: {
							unused_1: {default: 0, memo: 'unused', index: 7},
							blast_armed: {default: 0, memo: 'unused', index: 6},
							unused_3: {default: 0, memo: 'unused', index: 5},
							earth_leakage: {
								no_fault: 0,
								fault: 1,
								memo: 'Shaft earth leakage fault',
								index: 4,
								true: 'Detected',
								false: 'Cleared'
							},
							cable_fault: {
								no_fault: 0,
								fault: 1,
								memo: 'Shaft Cable fault',
								index: 3,
								true: 'Detected',
								false: 'Cleared'
							},
							fire_button: {
								open: 0,
								pressed: 1,
								memo: 'Fire button',
								index: 2,
								true: 'Pressed',
								false: 'not Pressed'
							},
							isolation_relay: {
								open: 0,
								closed: 1,
								memo: 'IBC-1 Isolation relay',
								index: 1,
								true: 'Opened',
								false: 'Closed'
							},
							key_switch_status: {
								disarm: 0,
								arm: 1,
								memo: 'IBC-1 Key-switch',
								index: 0,
								true: 'Armed',
								false: 'Disarmed'
							}
						}
					},
					remaining_bytes: null
				}
			},
			0b00001100: {
				command_id: 0b00001100,
				serial_type: 0b000,
				parent_type: 0b000,
				data: {
					data_type: 'data',
					first_byte: {
						read_type: 'bit',
						device_type: 0b000,
						parent_type: 0b000,
						bits: {
							unused_1: {default: 0, memo: 'unused', index: 7},
							broadcast: {default: 0, memo: 'broadcast', index: 6},
							collision: {default: 0, memo: 'collision', index: 5},
							missing_frame: {no_fault: 0, occurred: 1, memo: 'missing frame', index: 4},
							invalid_frame: {no_fault: 0, occurred: 1, memo: 'invalid frame', index: 3},
							parity_failure: {no_fault: 0, occurred: 1, memo: 'parity failure', index: 2},
							too_many_isc1s_connected: {
								no_fault: 0,
								occurred: 1,
								memo: 'too many isc1s connected',
								index: 6
							},
							too_many_ib651s_connected: {
								no_fault: 0,
								occurred: 1,
								memo: 'too many ib651s connected',
								index: 0
							}
						}
					},
					remaining_bytes: null
				}
			}
		};
	}
});

Object.defineProperty(CommandConstants.prototype, 'piToIbcCommands', {

	get: function () {

		/*
         NOTE: bit ordering is important! The index field here is used for sorting, but the MSB is OPPOSITE.
         ie: bit 0 is LSB and bit 7 is MSB.

         Bit numbering:
         ==============
         LSB = 0 (little endian) - ie: bit 7 = MSB, bit 0 = LSB, where bit 0 is the 'right-most' bit.
         */

		return {
			0b00000001: {
				command_id: 0b00000001,
				serial_type: 0b000,
				return_data_type: 'serial_list',
				return_serial_type: [0b001]
			},
			0b000000010: {
				command_id: 0b000000010,
				serial_type: 0b001,
				return_data_type: 'serial_list',
				return_serial_type: [0b010]
			},
			0b00000011: {
				command_id: 0b00000011,
				serial_type: 0b001,
				return_data_type: 'data_list',
				return_serial_type: [0b001, 0b010]
			},
			0b00000100: {
				command_id: 0b00000100,
				serial_type: 0b001,
				return_data_type: 'data_list',
				return_serial_type: [0b001, 0b010]
			},
			0b00000101: {
				command_id: 0b00000101,
				serial_type: 0b001,
				return_data_type: 'data_list',
				return_serial_type: [0b001, 0b010]
			},
			0b00000110: {
				command_id: 0b00000110,
				serial_type: 0b001,
				return_data_type: 'data_list',
				return_serial_type: [0b001, 0b010]
			},
			0b00000111: {
				command_id: 0b00000111,
				serial_type: 0b001,
				return_data_type: 'data',
				return_serial_type: 0b001
			},
			0b00001000: {
				command_id: 0b00001000,
				serial_type: 0b000,
				return_data_type: 'data',
				return_serial_type: 0b000
			},
			0b00001100: {
				command_id: 0b00001100,
				serial_type: 0b000,
				return_data_type: 'data',
				return_serial_type: 0b000
			}
		};
	}
});

CommandConstants.prototype.getSerialListConstants = function () {

	var self = this;
	var result = [];

	Object.keys(this.ibcToPiCommands).forEach(function (key) {
		var currentVal = self.ibcToPiCommands[key];
		if (currentVal.data.data_type == 'serial_list')
			result.push(currentVal);
	});

	return result;
};

CommandConstants.prototype.getDataConstants = function () {

	var self = this;
	var result = [];

	Object.keys(this.ibcToPiCommands).forEach(function (key) {
		var currentVal = self.ibcToPiCommands[key];
		if (currentVal.data.data_type == 'data')
			result.push(currentVal);
	});

	return result;
};

CommandConstants.prototype.getDataListConstants = function () {

	var self = this;
	var result = [];

	Object.keys(this.ibcToPiCommands).forEach(function (key) {
		var currentVal = self.ibcToPiCommands[key];
		if (currentVal.data.data_type == 'data_list')
			result.push(currentVal);
	});

	return result;
};

module.exports = CommandConstants;
