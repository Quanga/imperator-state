const packetConstants = {
	headerDelimiter: "aaaa",
	header: 4,
	size: 2,
	command: 2,
	serial: 4,
	crc: 4,
	total: 16
};

const getOutgoingCommands = {
	17: { name: "CMD_PI_OPEN_RELAY", binary: 0b00010010 },
	18: { name: "CMD_PI_OPEN_RELAY", binary: 0b00010001 }
};

const incomingCommTemplate = {
	1: {
		command: 1,
		binary: 0b00000001,
		parser: "deviceList",
		packetType: "mixed",
		chunk: 4,
		payload: {
			primary: {
				typeId: 0
			},
			secondary: {
				typeId: 1
			}
		}
	},
	2: {
		command: 2,
		binary: 0b000000010,
		parser: "deviceList",
		chunk: 4,
		packetType: "mixed",
		payload: {
			primary: {
				typeId: 1
			},
			secondary: {
				typeId: 2,
				chunkSize: 4
			}
		}
	},
	3: {
		command: 3,
		binary: 0b00000011,
		parser: "deviceData",
		packetType: "mixed",
		payload: {
			chunk: 4,
			primary: {
				typeId: 1,
				bitTemplate: this.unitBitTemplate[1]
			},
			secondary: {
				typeId: 2,
				bitTemplate: this.unitBitTemplate[2],
				chunkSize: 4
			}
		}
	},
	4: {
		command: 4,
		binary: 0b00000001,
		hex: 0x04,
		payload: {
			chunk: 10,
			primary: {
				typeId: 3,
				structure: {}
			},
			secondary: {
				typeId: 4,
				structure: {
					serial: { start: 0, length: 8, radix: 16 },
					windowId: { start: 8, length: 2, radix: 16 }
				}
			}
		}
	},
	5: {
		command: 5,
		hex: 0x05,
		binary: 0b00000101,
		payload: {
			chunk: 8,
			primary: {
				typeId: 3,
				structure: {
					childCount: { start: 0, length: 2, radix: 16 },
					ledState: { start: 4, length: 1, radix: 16 },
					data: { start: 5, length: 3, bitTemplate: this.unitBitTemplate[3] }
				}
			},
			secondary: {
				typeId: 4,
				structure: {
					childCount: { start: 0, length: 2, radix: 16 },
					delay: { start: 2, length: 2, radix: 16 },
					data: { start: 4, length: 4, bitTemplate: this.unitBitTemplate[4] }
				}
			}
		}
	},
	8: {
		command: 8,
		binary: 0b00001000,
		hex: 0x08,
		parser: "deviceData",
		packetType: "data",
		payload: {
			chunk: 4,
			primary: {
				typeId: 0,
				structure: {
					data: { start: 4, length: 4, bitTemplate: this.unitBitTemplate[0] }
				}
			}
		}
	},
	22: {
		desc: "500 List Packet",
		command: 22,
		binary: 0b00000001,
		hex: 0x16,
		payload: {
			chunk: 12,
			primary: {
				typeId: 3,
				structure: {}
			},
			secondary: {
				typeId: 4,
				chunkSize: 12,
				structure: {
					serial: { start: 0, length: 8, radix: 16 },
					windowId: { start: 4, length: 4, radix: 16 }
				}
			}
		}
	},
	23: {
		desc: "500 Data Packet",
		command: 23,
		binary: 0b00000101,
		payload: {
			chunk: 10,
			primary: {
				typeId: 3,
				structure: {
					serial: { start: 0, length: 8, radix: 16 },
					windowId: { start: 4, length: 4, radix: 16 },
					data: { bitTemplate: this.unitBitTemplate[3] }
				}
			},
			secondary: {
				typeId: 4,
				parentTypeId: 3,
				bitTemplate: this.unitBitTemplate[4],
				chunkSize: 10
			}
		}
	},
	24: {
		desc: "500 Wifi Data Packet",
		command: 24,
		binary: 0b00010010,
		hex: 0x18,
		parser: "deviceData",
		chunk: 8,
		packetType: "mixed",
		payload: {
			primary: {
				typeId: 3,
				structure: {
					lostPackets: { start: 0, length: 4, radix: 16 },
					packetSinceLastFiring: { start: 4, length: 4, radix: 16 }
				}
			}
		}
	},
	36: {
		desc: "CFC Data Packet",
		command: 36,
		parser: "deviceData",
		hex: 0x24,
		chunk: 10,
		packetType: "mixed",
		payload: {
			primary: {
				typeId: 5,
				bitTemplate: this.unitBitTemplate[5],
				extractor: rawData => ({
					qos: Math.floor((parseInt(rawData.substr(0, 2), 16) / 255) * 100),
					data: rawData ? this.convertRaw(rawData, 2, 2, 8, 2) : null,
					qosFiring: new PacketUtils(rawData).extractBytes(6, 2).convertToDec(16),
					firmware: parseInt(rawData.substr(8, 2), 10)
				})
			}
		}
	}
};

class PacketUtils {
	constructor(data) {
		this.data = data;
	}

	extractBytes(start, end) {
		this.bytes = this.data.substr(start, end);
		return this.bytes;
	}

	convertToDec(radix) {
		return parseInt(this.bytes, radix);
	}
}

const unitBitTemplate = {
	0: {
		bits: {
			unused1: { index: 7 },
			blastArmed: { index: 6 },
			unused3: { index: 5 },
			earthLeakage: { index: 4 },
			cableFault: { index: 3 },
			fireButton: { index: 2 },
			isolationRelay: { index: 1 },
			keySwitchStatus: { index: 0 }
		}
	},
	1: {
		bits: {
			unused1: { index: 7 },
			unused2: { index: 6 },
			unused3: { index: 5 },
			earthLeakage: { index: 4 },
			cableFault: { index: 3 },
			blastArmed: { index: 2 },
			isolationRelay: { index: 1 },
			keySwitchStatus: { index: 0 }
		}
	},
	2: {
		bits: {
			unused1: { index: 7 },
			missingPulseDetected: { index: 6 },
			partialBlast: { index: 5 },
			boosterFired: { index: 4 },
			mains: { index: 3 },
			detonatorStatus: { index: 2 },
			keySwitchStatus: { index: 1 },
			dcSupplyVoltage: { index: 0 }
		}
	},
	3: {
		bits: {
			keySwitchStatus: { index: 15 },
			cableFault: { index: 14 },
			earthLeakage: { index: 13 },
			mains: { index: 12 },
			shaftFault: { index: 11 },
			dcSupplyVoltage: { index: 10 },
			lowBat: { index: 9 },
			tooLowBat: { index: 8 },
			blastArmed: { index: 7 },
			lfs: { index: 6 },
			isolationRelay: { index: 5 },
			unused1: { index: 4 },
			unused2: { index: 3 },
			unused3: { index: 2 },
			unused4: { index: 1 },
			unused5: { index: 0 }
		}
	},
	4: {
		bits: {
			unused1: { index: 0 },
			bridgeWire: { index: 1 },
			calibration: { index: 2 },
			program: { index: 3 },
			boosterFired: { index: 4 },
			tagged: { index: 5 },
			detonatorStatus: { index: 6 },
			logged: { index: 7 }
		}
	},
	5: {
		bits: {
			min2: { index: 0 },
			min7: { index: 1 },
			cableFault: { index: 2 },
			elt: { index: 3 },
			unused3: { index: 4 },
			unused2: { index: 5 },
			unused1: { index: 6 },
			deviceType: { index: 7 }
		}
	}
};

const loggableTypes = {
	0: "Control Unit",
	1: "ISC",
	2: "I651",
	3: "CBB",
	4: "EDD"
};

const loggables = [
	"blastArmed",
	"communicationStatus",
	"keySwitchStatus",
	"fireButton",
	"isolationRelay",
	"dcSupplyVoltage",
	"cableFault",
	"earthLeakage",
	"boosterFired",
	"shaftFault",
	"mains",
	"lfs",
	"lowBat",
	"childCount"
];

const warnables = {
	cableFault: 1,
	earthLeakage: 1,
	mains: 0,
	lowBat: 1,
	shaftFault: 1
};

module.exports = {
	packetConstants,
	incomingCommTemplate,
	getOutgoingCommands,
	warnables,
	loggables,
	loggableTypes,
	unitBitTemplate
};
