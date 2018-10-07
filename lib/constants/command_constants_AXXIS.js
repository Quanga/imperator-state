/**
 * Created by grant on 2016/06/27.
 */

var CommandConstants = function() {};

//Object.defineProperty(CommandConstants.prototype, "ibcToPiCommands", {
//    get: function () {
//
//        return {
//            isc1_serial_list: {hex: 0x1, bin: 0b00000001},
//            ib651_serial_list_normal: {hex: 0x2, bin: 0b00000010},
//            ib651_serial_list_broadcast: {hex: 0x42, bin: 0b01000010},
//            default_data_isc1_normal_ib651_normal: {hex: 0x3, bin: 0b00000011},
//            default_data_isc1_normal_ib651_broadcast: {hex: 0x43, bin: 0b01000011},
//            default_data_isc1_broadcast_ib651_normal: {hex: 0x83, bin: 0b10000011},
//            default_data_isc1_broadcast_ib651_broadcast: {hex: 0xc3, bin: 0b11000011},
//
//            ibc1_errors_normal: {hex: 0xc, bin: 0b00001100},
//            ibc1_errors_broadcast: {hex: 0x8c, bin: 0b10001100},
//
//            dc_voltage_isc1_normal_ib651_normal: {hex: 0x4, bin: 0b00000100},
//            dc_voltage_isc1_normal_ib651_broadcast: {hex: 0x44, bin: 0b01000100},
//            dc_voltage_isc1_broadcast_ib651_normal: {hex: 0x84, bin: 0b10000100},
//            dc_voltage_isc1_broadcast_ib651_broadcast: {hex: 0xC4, bin: 0b11000100},
//
//            ac_voltage_isc1_normal_ib651_normal: {hex: 0x5, bin: 0b00000101},
//            ac_voltage_isc1_normal_ib651_broadcast: {hex: 0x45, bin: 0b01000101},
//            ac_voltage_isc1_broadcast_ib651_normal: {hex: 0x85, bin: 0b10000101},
//            ac_voltage_isc1_broadcast_ib651_broadcast: {hex: 0xC5, bin: 0b11000101},
//
//            blasting_circuit_isc1_normal_ib651_normal: {hex: 0x6, bin: 0b00000110},
//            blasting_circuit_isc1_normal_ib651_broadcast: {hex: 0x46, bin: 0b01000110},
//            blasting_circuit_isc1_broadcast_ib651_normal: {hex: 0x86, bin: 0b10000110},
//            blasting_circuit_isc1_broadcast_ib651_broadcast: {hex: 0xC6, bin: 0b11000110},
//
//            rssi_value_ibc1_normal: {hex: 0x7, bin: 0b00000111},
//            rssi_value_ibc1_broadcast: {hex: 0x87, bin: 0b10000111},
//
//            default_data_ibc1_normal: {hex: 0x8, bin: 0b00001000},
//            default_data_ibc1_broadcast: {hex: 0x88, bin: 0b10001000},
//
//            permission_to_blast: {hex: 0x90, bin: 0b10010000},
//            blast_command_acknowledged: {hex: 0xA5, bin: 0b10100101},
//            ping_request_isc1_acknowledged: {hex: 0xA9, bin: 0b010101001},
//            arm_isc1_request_acknowledged: {hex: 0xB1, bin: 0b10110001},
//            disarm_isc1_request_acknowledged: {hex: 0xB0, bin: 0b10110000}
//        }
//    }
//});

Object.defineProperty(CommandConstants.prototype, "ibcToPiDataDeviceTypes", {
	get: function() {
		return {
			ibc1: { bin: 0b000, hex: 0x0 },
			isc1: { bin: 0b001, hex: 0x1 },
			ib651: { bin: 0b010, hex: 0x2 }
		};
	}
});

Object.defineProperty(CommandConstants.prototype, "ibcToPiDataDeviceIds", {
	get: function() {
		return {
			ibc1_1: {
				id: {
					type_frag: 0b000,
					id_frag: 0b00001,
					bin: 0b00000001,
					hex: 0x1,
					dec: 1
				}
			},
			ibc1_2: {
				id: {
					type_frag: 0b000,
					id_frag: 0b00010,
					bin: 0b00000010,
					hex: 0x2,
					dec: 2
				}
			},
			ibc1_3: {
				id: {
					type_frag: 0b000,
					id_frag: 0b00011,
					bin: 0b00000011,
					hex: 0x3,
					dec: 3
				}
			},
			ibc1_4: {
				id: {
					type_frag: 0b000,
					id_frag: 0b00100,
					bin: 0b00000100,
					hex: 0x4,
					dec: 4
				}
			},
			ibc1_5: {
				id: {
					type_frag: 0b000,
					id_frag: 0b00101,
					bin: 0b00000101,
					hex: 0x5,
					dec: 5
				}
			},
			ibc1_6: {
				id: {
					type_frag: 0b000,
					id_frag: 0b00110,
					bin: 0b00000110,
					hex: 0x6,
					dec: 6
				}
			},
			ibc1_7: {
				id: {
					type_frag: 0b000,
					id_frag: 0b00111,
					bin: 0b00000111,
					hex: 0x7,
					dec: 7
				}
			},
			ibc1_8: {
				id: {
					type_frag: 0b000,
					id_frag: 0b01000,
					bin: 0b00001000,
					hex: 0x8,
					dec: 8
				}
			},
			ibc1_9: {
				id: {
					type_frag: 0b000,
					id_frag: 0b01001,
					bin: 0b00001001,
					hex: 0x9,
					dec: 9
				}
			},
			ibc1_10: {
				id: {
					type_frag: 0b000,
					id_frag: 0b01010,
					bin: 0b00001010,
					hex: 0xa,
					dec: 10
				}
			},
			ibc1_11: {
				id: {
					type_frag: 0b000,
					id_frag: 0b01011,
					bin: 0b00001011,
					hex: 0xb,
					dec: 11
				}
			},
			ibc1_12: {
				id: {
					type_frag: 0b000,
					id_frag: 0b01100,
					bin: 0b00001100,
					hex: 0xc,
					dec: 12
				}
			},
			ibc1_13: {
				id: {
					type_frag: 0b000,
					id_frag: 0b01101,
					bin: 0b00001101,
					hex: 0xd,
					dec: 13
				}
			},
			ibc1_14: {
				id: {
					type_frag: 0b000,
					id_frag: 0b01110,
					bin: 0b00001110,
					hex: 0xe,
					dec: 14
				}
			},
			ibc1_15: {
				id: {
					type_frag: 0b000,
					id_frag: 0b01111,
					bin: 0b00001111,
					hex: 0xf,
					dec: 15
				}
			},
			ibc1_16: {
				id: {
					type_frag: 0b000,
					id_frag: 0b10000,
					bin: 0b00010000,
					hex: 0x10,
					dec: 16
				}
			},
			ibc1_17: {
				id: {
					type_frag: 0b000,
					id_frag: 0b10001,
					bin: 0b00010001,
					hex: 0x11,
					dec: 17
				}
			},
			ibc1_18: {
				id: {
					type_frag: 0b000,
					id_frag: 0b10010,
					bin: 0b00010010,
					hex: 0x12,
					dec: 18
				}
			},
			ibc1_19: {
				id: {
					type_frag: 0b000,
					id_frag: 0b10011,
					bin: 0b00010011,
					hex: 0x13,
					dec: 19
				}
			},
			ibc1_20: {
				id: {
					type_frag: 0b000,
					id_frag: 0b10100,
					bin: 0b00010100,
					hex: 0x14,
					dec: 20
				}
			},
			ibc1_21: {
				id: {
					type_frag: 0b000,
					id_frag: 0b10101,
					bin: 0b00010101,
					hex: 0x15,
					dec: 21
				}
			},
			ibc1_22: {
				id: {
					type_frag: 0b000,
					id_frag: 0b10110,
					bin: 0b00010110,
					hex: 0x16,
					dec: 22
				}
			},
			ibc1_23: {
				id: {
					type_frag: 0b000,
					id_frag: 0b10111,
					bin: 0b00010111,
					hex: 0x17,
					dec: 23
				}
			},
			ibc1_24: {
				id: {
					type_frag: 0b000,
					id_frag: 0b11000,
					bin: 0b00011000,
					hex: 0x18,
					dec: 24
				}
			},
			ibc1_25: {
				id: {
					type_frag: 0b000,
					id_frag: 0b11001,
					bin: 0b00011001,
					hex: 0x19,
					dec: 25
				}
			},
			ibc1_26: {
				id: {
					type_frag: 0b000,
					id_frag: 0b11010,
					bin: 0b00011010,
					hex: 0x1a,
					dec: 26
				}
			},
			ibc1_27: {
				id: {
					type_frag: 0b000,
					id_frag: 0b11011,
					bin: 0b00011011,
					hex: 0x1b,
					dec: 27
				}
			},
			ibc1_28: {
				id: {
					type_frag: 0b000,
					id_frag: 0b11100,
					bin: 0b00011100,
					hex: 0x1c,
					dec: 28
				}
			},
			ibc1_29: {
				id: {
					type_frag: 0b000,
					id_frag: 0b11101,
					bin: 0b00011101,
					hex: 0x1d,
					dec: 29
				}
			},
			ibc1_30: {
				id: {
					type_frag: 0b000,
					id_frag: 0b11110,
					bin: 0b00011110,
					hex: 0x1e,
					dec: 30
				}
			},

			ib651_1: {
				id: {
					type_frag: 0b010,
					id_frag: 0b00001,
					bin: 0b00100001,
					hex: 0x21,
					dec: 33
				}
			},
			ib651_2: {
				id: {
					type_frag: 0b010,
					id_frag: 0b00010,
					bin: 0b00100010,
					hex: 0x22,
					dec: 34
				}
			},
			ib651_3: {
				id: {
					type_frag: 0b010,
					id_frag: 0b00011,
					bin: 0b00100011,
					hex: 0x23,
					dec: 35
				}
			},
			ib651_4: {
				id: {
					type_frag: 0b010,
					id_frag: 0b00100,
					bin: 0b00100100,
					hex: 0x24,
					dec: 36
				}
			},
			ib651_5: {
				id: {
					type_frag: 0b010,
					id_frag: 0b00101,
					bin: 0b00100101,
					hex: 0x25,
					dec: 37
				}
			},
			ib651_6: {
				id: {
					type_frag: 0b010,
					id_frag: 0b00110,
					bin: 0b00100110,
					hex: 0x26,
					dec: 38
				}
			},
			ib651_7: {
				id: {
					type_frag: 0b010,
					id_frag: 0b00111,
					bin: 0b00100111,
					hex: 0x27,
					dec: 39
				}
			},
			ib651_8: {
				id: {
					type_frag: 0b010,
					id_frag: 0b01000,
					bin: 0b00101000,
					hex: 0x28,
					dec: 40
				}
			},
			ib651_9: {
				id: {
					type_frag: 0b010,
					id_frag: 0b01001,
					bin: 0b00101001,
					hex: 0x29,
					dec: 41
				}
			},
			ib651_10: {
				id: {
					type_frag: 0b010,
					id_frag: 0b01010,
					bin: 0b00101010,
					hex: 0x2a,
					dec: 42
				}
			},
			ib651_11: {
				id: {
					type_frag: 0b010,
					id_frag: 0b01011,
					bin: 0b00101011,
					hex: 0x2b,
					dec: 43
				}
			},
			ib651_12: {
				id: {
					type_frag: 0b010,
					id_frag: 0b01100,
					bin: 0b00101100,
					hex: 0x2c,
					dec: 44
				}
			},
			ib651_13: {
				id: {
					type_frag: 0b010,
					id_frag: 0b01101,
					bin: 0b00101101,
					hex: 0x2d,
					dec: 45
				}
			},
			ib651_14: {
				id: {
					type_frag: 0b010,
					id_frag: 0b01110,
					bin: 0b00101110,
					hex: 0x2e,
					dec: 46
				}
			},
			ib651_15: {
				id: {
					type_frag: 0b010,
					id_frag: 0b01111,
					bin: 0b00101111,
					hex: 0x2f,
					dec: 47
				}
			},
			ib651_16: {
				id: {
					type_frag: 0b010,
					id_frag: 0b10000,
					bin: 0b00110000,
					hex: 0x30,
					dec: 48
				}
			},
			ib651_17: {
				id: {
					type_frag: 0b010,
					id_frag: 0b10001,
					bin: 0b00110001,
					hex: 0x31,
					dec: 49
				}
			},
			ib651_18: {
				id: {
					type_frag: 0b010,
					id_frag: 0b10010,
					bin: 0b00110010,
					hex: 0x32,
					dec: 50
				}
			},
			ib651_19: {
				id: {
					type_frag: 0b010,
					id_frag: 0b10011,
					bin: 0b00110011,
					hex: 0x33,
					dec: 51
				}
			},
			ib651_20: {
				id: {
					type_frag: 0b010,
					id_frag: 0b10100,
					bin: 0b00110100,
					hex: 0x34,
					dec: 52
				}
			},
			ib651_21: {
				id: {
					type_frag: 0b010,
					id_frag: 0b10101,
					bin: 0b00110101,
					hex: 0x35,
					dec: 53
				}
			},
			ib651_22: {
				id: {
					type_frag: 0b010,
					id_frag: 0b10110,
					bin: 0b00110110,
					hex: 0x36,
					dec: 54
				}
			},
			ib651_23: {
				id: {
					type_frag: 0b010,
					id_frag: 0b10111,
					bin: 0b00110111,
					hex: 0x37,
					dec: 55
				}
			},
			ib651_24: {
				id: {
					type_frag: 0b010,
					id_frag: 0b11000,
					bin: 0b00111000,
					hex: 0x38,
					dec: 56
				}
			},
			ib651_25: {
				id: {
					type_frag: 0b010,
					id_frag: 0b11001,
					bin: 0b00111001,
					hex: 0x39,
					dec: 57
				}
			},
			ib651_26: {
				id: {
					type_frag: 0b010,
					id_frag: 0b11010,
					bin: 0b00111010,
					hex: 0x3a,
					dec: 58
				}
			},
			ib651_27: {
				id: {
					type_frag: 0b010,
					id_frag: 0b11011,
					bin: 0b00111011,
					hex: 0x3b,
					dec: 59
				}
			},
			ib651_28: {
				id: {
					type_frag: 0b010,
					id_frag: 0b11100,
					bin: 0b00111100,
					hex: 0x3c,
					dec: 60
				}
			},
			ib651_29: {
				id: {
					type_frag: 0b010,
					id_frag: 0b11101,
					bin: 0b00111101,
					hex: 0x3d,
					dec: 61
				}
			},
			ib651_30: {
				id: {
					type_frag: 0b010,
					id_frag: 0b11110,
					bin: 0b00111110,
					hex: 0x3e,
					dec: 62
				}
			},

			isc1_1: {
				id: {
					type_frag: 0b001,
					id_frag: 0b00001,
					bin: 0b01000001,
					hex: 0x41,
					dec: 65
				}
			},
			isc1_2: {
				id: {
					type_frag: 0b001,
					id_frag: 0b00010,
					bin: 0b01000010,
					hex: 0x42,
					dec: 66
				}
			},
			isc1_3: {
				id: {
					type_frag: 0b001,
					id_frag: 0b00011,
					bin: 0b01000011,
					hex: 0x43,
					dec: 67
				}
			},
			isc1_4: {
				id: {
					type_frag: 0b001,
					id_frag: 0b00100,
					bin: 0b01000100,
					hex: 0x44,
					dec: 68
				}
			},
			isc1_5: {
				id: {
					type_frag: 0b001,
					id_frag: 0b00101,
					bin: 0b01000101,
					hex: 0x45,
					dec: 69
				}
			},
			isc1_6: {
				id: {
					type_frag: 0b001,
					id_frag: 0b00110,
					bin: 0b01000110,
					hex: 0x46,
					dec: 70
				}
			},
			isc1_7: {
				id: {
					type_frag: 0b001,
					id_frag: 0b00111,
					bin: 0b01000111,
					hex: 0x47,
					dec: 71
				}
			},
			isc1_8: {
				id: {
					type_frag: 0b001,
					id_frag: 0b01000,
					bin: 0b01001000,
					hex: 0x48,
					dec: 72
				}
			},
			isc1_9: {
				id: {
					type_frag: 0b001,
					id_frag: 0b01001,
					bin: 0b01001001,
					hex: 0x49,
					dec: 73
				}
			},
			isc1_10: {
				id: {
					type_frag: 0b001,
					id_frag: 0b01010,
					bin: 0b01001010,
					hex: 0x4a,
					dec: 74
				}
			},
			isc1_11: {
				id: {
					type_frag: 0b001,
					id_frag: 0b01011,
					bin: 0b01001011,
					hex: 0x4b,
					dec: 75
				}
			},
			isc1_12: {
				id: {
					type_frag: 0b001,
					id_frag: 0b01100,
					bin: 0b01001100,
					hex: 0x4c,
					dec: 76
				}
			},
			isc1_13: {
				id: {
					type_frag: 0b001,
					id_frag: 0b01101,
					bin: 0b01001101,
					hex: 0x4d,
					dec: 77
				}
			},
			isc1_14: {
				id: {
					type_frag: 0b001,
					id_frag: 0b01110,
					bin: 0b01001110,
					hex: 0x4e,
					dec: 78
				}
			},
			isc1_15: {
				id: {
					type_frag: 0b001,
					id_frag: 0b01111,
					bin: 0b01001111,
					hex: 0x4f,
					dec: 79
				}
			},
			isc1_16: {
				id: {
					type_frag: 0b001,
					id_frag: 0b11110,
					bin: 0b01010000,
					hex: 0x50,
					dec: 80
				}
			},
			isc1_17: {
				id: {
					type_frag: 0b001,
					id_frag: 0b10001,
					bin: 0b01010001,
					hex: 0x51,
					dec: 81
				}
			},
			isc1_18: {
				id: {
					type_frag: 0b001,
					id_frag: 0b10010,
					bin: 0b01010010,
					hex: 0x52,
					dec: 82
				}
			},
			isc1_19: {
				id: {
					type_frag: 0b001,
					id_frag: 0b10011,
					bin: 0b01010011,
					hex: 0x53,
					dec: 83
				}
			},
			isc1_20: {
				id: {
					type_frag: 0b001,
					id_frag: 0b10100,
					bin: 0b01010100,
					hex: 0x54,
					dec: 84
				}
			},
			isc1_21: {
				id: {
					type_frag: 0b001,
					id_frag: 0b10101,
					bin: 0b01010101,
					hex: 0x55,
					dec: 85
				}
			},
			isc1_22: {
				id: {
					type_frag: 0b001,
					id_frag: 0b10110,
					bin: 0b01010110,
					hex: 0x56,
					dec: 86
				}
			},
			isc1_23: {
				id: {
					type_frag: 0b001,
					id_frag: 0b10111,
					bin: 0b01010111,
					hex: 0x57,
					dec: 87
				}
			},
			isc1_24: {
				id: {
					type_frag: 0b001,
					id_frag: 0b11000,
					bin: 0b01011000,
					hex: 0x58,
					dec: 88
				}
			},
			isc1_25: {
				id: {
					type_frag: 0b001,
					id_frag: 0b11001,
					bin: 0b01011001,
					hex: 0x59,
					dec: 89
				}
			},
			isc1_26: {
				id: {
					type_frag: 0b001,
					id_frag: 0b11010,
					bin: 0b01011010,
					hex: 0x5a,
					dec: 90
				}
			},
			isc1_27: {
				id: {
					type_frag: 0b001,
					id_frag: 0b11011,
					bin: 0b01011011,
					hex: 0x5b,
					dec: 91
				}
			},
			isc1_28: {
				id: {
					type_frag: 0b001,
					id_frag: 0b11100,
					bin: 0b01011100,
					hex: 0x5c,
					dec: 92
				}
			},
			isc1_29: {
				id: {
					type_frag: 0b001,
					id_frag: 0b11101,
					bin: 0b01011101,
					hex: 0x5d,
					dec: 93
				}
			},
			isc1_30: {
				id: {
					type_frag: 0b001,
					id_frag: 0b11110,
					bin: 0b01011110,
					hex: 0x5e,
					dec: 94
				}
			}
		};
	}
});

Object.defineProperty(CommandConstants.prototype, "ibcToPiCommands", {
	get: function() {
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
				data: {
					data_type: "serial_list",
					first_byte: {
						read_type: "byte",
						device_type: 0b001,
						bits: null
					},
					remaining_bytes: {
						read_type: "byte",
						device_type: 0b001,
						bits: null
					}
				}
			},
			0b000000010: {
				command_id: 0b000000010,
				serial_type: 0b001, // the serial field contains the device id of the ISC-1
				data: {
					data_type: "serial_list",
					first_byte: {
						read_type: "byte",
						device_type: 0b010,
						bits: null
					},
					remaining_bytes: {
						read_type: "byte",
						device_type: 0b010,
						bits: null
					}
				}
			},
			0b00000011: {
				command_id: 0b00000011,
				serial_type: 0b001, // the serial field contains the device id of the ISC-1
				data: {
					data_type: "data_list",
					remaining_bytes: {
						read_type: "bit",
						device_type: 0b010,
						bits: {
							unused_1: { default: 0, memo: "unused", index: 7 },
							// pulse_25_removed: {not_removed: 0, removed: 1, memo: '25th pulse removed', index: 6},
							missing_pulse_detected_lfs: {
								not_removed: 0,
								removed: 1,
								memo: "25th pulse",
								index: 6,
								true: "Removed",
								false: "not Removed"
							},
							partial_blast_lfs: {
								no_partial_blast: 0,
								mains_present_for_more_than_5s: 1,
								memo: "CBB partial blast",
								index: 5,
								true: "Detected",
								false: "not Detected"
							},
							booster_fired_lfs: {
								booster_did_not_fire: 0,
								booster_fired: 1,
								memo: "CBB",
								index: 4,
								true: "Fired",
								false: "did not Fire"
							},
							mains: {
								not_present: 0,
								present_for_more_than_15s: 1,
								memo: "Mains",
								index: 3,
								true: "present for more than 15s",
								false: "present for less than 15s"
							},
							detonator_status: {
								not_connected: 0,
								connected: 1,
								memo: "CBB Detonator",
								index: 2,
								true: "Calibrated",
								false: "not Calibrated"
							},
							key_switch_status: {
								disarm: 0,
								arm: 1,
								memo: "CBB Key-switch",
								index: 1,
								true: "Armed",
								false: "Disarmed"
							},
							DC_supply_voltage: {
								wrong: 0,
								OK: 1,
								memo: "CBB DC supply voltage",
								index: 0,
								true: "Low",
								false: "Normal"
							}
						}
					},
					first_byte: {
						read_type: "bit",
						device_type: 0b001,
						bits: {
							unused_1: { default: 0, memo: "unused", index: 7 },
							unused_2: { default: 0, memo: "unused", index: 6 },
							unused_3: { default: 0, memo: "unused", index: 5 },
							earth_leakage: {
								no_fault: 0,
								fault: 1,
								memo: "CSB earth leakage fault",
								index: 4,
								true: "Detected",
								false: "Cleared"
							},
							cable_fault: {
								no_fault: 0,
								fault: 1,
								memo: "Cable fault to CBBs",
								index: 3,
								true: "Detected",
								false: "Cleared"
							},
							blast_armed: {
								disarmed: 0,
								armed: 1,
								memo: "CSB",
								index: 2,
								true: "Armed for Blast",
								false: "Disarmed"
							},
							isolation_relay: {
								open: 0,
								closed: 1,
								memo: "CSB Shaft Isolation relay",
								index: 1,
								true: "Opened",
								false: "Closed"
							},
							key_switch_status: {
								disarm: 0,
								arm: 1,
								memo: "CSB Key-switch",
								index: 0,
								false: "Armed",
								true: "Isolated"
							}
						}
					}
				}
			},
			0b00000100: {
				command_id: 0b00000100,
				serial_type: 0b001,
				data: {
					data_type: "data_list",
					first_byte: {
						read_type: "byte",
						device_type: 0b001,
						bits: null,
						multiplier: 0.2
					},
					remaining_bytes: {
						read_type: "byte",
						device_type: 0b010,
						bits: null,
						multiplier: 0.2
					}
				}
			},
			0b00000101: {
				command_id: 0b00000101,
				serial_type: 0b001,
				data: {
					data_type: "data_list",
					first_byte: {
						read_type: "byte",
						device_type: 0b001,
						bits: null,
						multiplier: 1.12
					},
					remaining_bytes: {
						read_type: "byte",
						device_type: 0b010,
						bits: null,
						multiplier: 1.12
					}
				}
			},
			0b00000110: {
				command_id: 0b00000110,
				serial_type: 0b001,
				data: {
					data_type: "data_list",
					first_byte: {
						read_type: "byte",
						device_type: 0b001,
						bits: null
					},
					remaining_bytes: {
						read_type: "byte",
						device_type: 0b010,
						bits: null
					}
				}
			},
			0b00000111: {
				command_id: 0b00000111,
				serial_type: 0b001,
				data: {
					data_type: "data",
					first_byte: {
						read_type: "byte",
						device_type: 0b001,
						bits: null
					},
					remaining_bytes: null
				}
			},
			0b00001000: {
				command_id: 0b00001000,
				serial_type: 0b000,
				data: {
					data_type: "data",
					first_byte: {
						read_type: "bit",
						device_type: 0b000,
						bits: {
							unused_1: { default: 0, memo: "unused", index: 7 },
							unused_2: { default: 0, memo: "unused", index: 6 },
							unused_3: { default: 0, memo: "unused", index: 5 },
							earth_leakage: {
								no_fault: 0,
								fault: 1,
								memo: "CCB earth leakage fault",
								index: 4,
								true: "Detected",
								false: "Cleared"
							},
							cable_fault: {
								no_fault: 0,
								fault: 1,
								memo: "CCB Cable fault",
								index: 3,
								true: "Detected",
								false: "Cleared"
							},
							fire_button: {
								open: 0,
								pressed: 1,
								memo: "Fire button",
								index: 2,
								true: "Pressed",
								false: "not Pressed"
							},
							isolation_relay: {
								open: 0,
								closed: 1,
								memo: "CBB Isolation relay",
								index: 1,
								true: "Opened",
								false: "Closed"
							},
							key_switch_status: {
								disarm: 0,
								arm: 1,
								memo: "CBB Key switch",
								index: 0,
								true: "Armed",
								false: "Disarmed"
							}
						}
					},
					remaining_bytes: null
				}
			},
			0b00001100: {
				command_id: 0b00001100,
				serial_type: 0b000,
				data: {
					data_type: "data",
					first_byte: {
						read_type: "bit",
						device_type: 0b000,
						bits: {
							unused_1: { default: 0, memo: "unused", index: 7 },
							broadcast: { default: 0, memo: "broadcast", index: 6 },
							collision: { default: 0, memo: "collision", index: 5 },
							missing_frame: {
								no_fault: 0,
								occurred: 1,
								memo: "missing frame",
								index: 4
							},
							invalid_frame: {
								no_fault: 0,
								occurred: 1,
								memo: "invalid frame",
								index: 3
							},
							parity_failure: {
								no_fault: 0,
								occurred: 1,
								memo: "parity failure",
								index: 2
							},
							too_many_isc1s_connected: {
								no_fault: 0,
								occurred: 1,
								memo: "too many isc1s connected",
								index: 6
							},
							too_many_ib651s_connected: {
								no_fault: 0,
								occurred: 1,
								memo: "too many ib651s connected",
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

Object.defineProperty(CommandConstants.prototype, "piToIbcCommands", {
	get: function() {
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
				return_data_type: "serial_list",
				return_serial_type: [0b001]
			},
			0b000000010: {
				command_id: 0b000000010,
				serial_type: 0b001,
				return_data_type: "serial_list",
				return_serial_type: [0b010]
			},
			0b00000011: {
				command_id: 0b00000011,
				serial_type: 0b001,
				return_data_type: "data_list",
				return_serial_type: [0b001, 0b010]
			},
			0b00000100: {
				command_id: 0b00000100,
				serial_type: 0b001,
				return_data_type: "data_list",
				return_serial_type: [0b001, 0b010]
			},
			0b00000101: {
				command_id: 0b00000101,
				serial_type: 0b001,
				return_data_type: "data_list",
				return_serial_type: [0b001, 0b010]
			},
			0b00000110: {
				command_id: 0b00000110,
				serial_type: 0b001,
				return_data_type: "data_list",
				return_serial_type: [0b001, 0b010]
			},
			0b00000111: {
				command_id: 0b00000111,
				serial_type: 0b001,
				return_data_type: "data",
				return_serial_type: 0b001
			},
			0b00001000: {
				command_id: 0b00001000,
				serial_type: 0b000,
				return_data_type: "data",
				return_serial_type: 0b000
			},
			0b00001100: {
				command_id: 0b00001100,
				serial_type: 0b000,
				return_data_type: "data",
				return_serial_type: 0b000
			}
		};
	}
});

module.exports = CommandConstants;
