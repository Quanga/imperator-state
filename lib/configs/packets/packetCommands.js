const { unitTypes } = require("../../constants/typeConstants");
const { dataBits } = require("./dataBits");
const fields = require("../fields/fieldConstants");
const { serial, typeId, windowId, childCount, ledState, delay } = fields;
const { lsp, packetSinceLastFiring, qos, firmware, qosFiring } = fields;

const commands = {
	4: { desc: "EDD List Packet", cmd: 4, hex: 0x04 },
	5: { desc: "Booster Data Packet", cmd: 5, hex: 0x05 },
	8: { desc: "Control Unit Packet", cmd: 8, hex: 0x08 },
	22: { desc: "500 Series List Packet", cmd: 22, hex: 0x16 },
	23: { desc: "500 Series Data Packet", cmd: 23, hex: 0x17 },
	24: { desc: "500 Wifi Packet", cmd: 24, hex: 0x18 },
	34: { desc: "CFC data packet", cmd: 36, hex: 0x24 },
};

const constants = {
	headerDelimiter: "aaaa",
	header: 4,
	size: 2,
	command: 2,
	serial: 4,
	crc: 4,
	total: 16,
};

const payloads = {
	4: {
		chunk: 10,
		format: {
			primary: {
				typeId: unitTypes.BOOSTER_T2,
			},
			secondary: {
				typeId: unitTypes.EDD,
				structure: {
					meta: {
						[serial]: { start: 0, length: 8, format: ["hexToDec", "toIP"] },
						[windowId]: { start: 8, length: 2, format: ["hexToDec"] },
					},
				},
			},
		},
		signals: {
			EDD_SIG: {
				conditions: { length: 2 },
				structure: [{ [typeId]: 3 }, { [typeId]: 4, [serial]: "255.255.255.255", [windowId]: 255 }],
			},
		},
	},
	5: {
		chunk: 8,
		format: {
			primary: {
				typeId: unitTypes.BOOSTER_T2,
				structure: {
					data: {
						[childCount]: {
							start: 0,
							length: 2,
							format: { 101: ["hexToDec"], 501: ["hexToDec", "reverseSerialBytes"] },
						},
						[ledState]: { start: 4, length: 1, format: ["hexToDec"] },
						bits: { start: 5, length: 3, format: { bits: dataBits[3] } },
					},
				},
			},
			secondary: {
				typeId: unitTypes.EDD,
				structure: {
					meta: {
						[windowId]: { start: 0, length: 2, format: ["hexToDec"] },
					},
					data: {
						bits: { start: 2, length: 2, format: { bits: dataBits[4] } },
						[delay]: { start: 4, length: 4, format: ["hexToDec", "reverseSerialBytes"] },
					},
				},
			},
		},
	},
	8: {
		chunk: 4,
		format: {
			primary: {
				typeId: unitTypes.CONTROL_UNIT,
				structure: {
					data: {
						bits: { start: 2, length: 2, format: { bits: dataBits[0] } },
					},
				},
			},
		},
	},
	22: {
		chunk: 12,
		format: {
			primary: {
				typeId: unitTypes.BOOSTER_T2,
			},
			secondary: {
				typeId: unitTypes.EDD,
				structure: {
					meta: {
						[serial]: { start: 0, length: 8, format: ["hexToDec", "toIP"] },
						[windowId]: {
							start: 8,
							length: 4,
							format: ["hexToDec", "reverseSerialBytes"],
						},
					},
				},
			},
		},
	},
	23: {
		chunk: 10,
		format: {
			primary: {
				typeId: unitTypes.BOOSTER_T2,
			},
			secondary: {
				typeId: unitTypes.EDD,
				structure: {
					meta: {
						[windowId]: {
							start: 0,
							length: 4,
							format: ["hexToDec", "reverseSerialBytes"],
						},
					},
					data: {
						bits: { start: 4, length: 2, format: { bits: dataBits[4] } },
						[delay]: { start: 6, length: 4, format: ["hexToDec", "reverseSerialBytes"] },
					},
				},
			},
		},
	},
	24: {
		chunk: 8,
		format: {
			primary: {
				typeId: unitTypes.BOOSTER_T2,
				structure: {
					data: {
						[lsp]: { start: 4, length: 4, format: ["hexToDec"] },
						[packetSinceLastFiring]: { start: 4, length: 4, format: ["hexToDec"] },
					},
				},
			},
		},
	},
	36: {
		chunk: 10,
		format: {
			primary: {
				typeId: unitTypes.CFC,
				structure: {
					data: {
						[qos]: { start: 0, length: 2, format: ["hexToDec", "hexToPercent"] },
						bits: { start: 2, length: 2, format: { bits: dataBits[5] } },
						[qosFiring]: { start: 6, length: 2, format: ["hexToDec"] },
						[firmware]: { start: 8, length: 2, format: ["hexToDec"] },
					},
				},
			},
		},
	},
};

module.exports = { commands, payloads, constants };
