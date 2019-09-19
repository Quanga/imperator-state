class IncomingCommTemplate {
	constructor() {}

	get packetConstants() {
		return {
			headerDelimiter: "aaaa",
			header: 4,
			size: 2,
			command: 2,
			serial: 4,
			crc: 4,
			total: 16
		};
	}

	get getOutgoingCommands() {
		return {
			17: { name: "CMD_PI_OPEN_RELAY", binary: 0b00010010 },
			18: { name: "CMD_PI_OPEN_RELAY", binary: 0b00010001 }
		};
	}

	get incomingCommTemplate() {
		return {
			1: {
				command: 1,
				binary: 0b00000001,
				parser: "deviceList",
				packetType: "mixed",
				chunk: 4,
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
				command: 2,
				binary: 0b000000010,
				parser: "deviceList",
				chunk: 4,
				packetType: "mixed",
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
				command: 3,
				binary: 0b00000011,
				parser: "deviceData",
				chunk: 4,
				packetType: "mixed",
				windowIdBits: 2,
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
				command: 4,
				binary: 0b00000001,
				parser: "deviceList",
				chunk: 10,
				packetType: "mixed",
				windowIdBits: 2,
				payload: {
					primary: {
						typeId: 3,
						parentTypeId: 0
					},
					secondary: {
						typeId: 4,
						parentTypeId: 3
					}
				}
			},
			5: {
				command: 5,
				binary: 0b00000101,
				parser: "deviceData",
				chunk: 8,
				packetType: "mixed",
				windowIdBits: 2,
				payload: {
					primary: {
						typeId: 3,
						parentTypeId: 0,
						bitTemplate: this.unitBitTemplate[3]
					},
					secondary: {
						typeId: 4,
						parentTypeId: 3,
						bitTemplate: this.unitBitTemplate[4]
					}
				}
			},
			8: {
				command: 8,
				binary: 0b00001000,
				parser: "deviceData",
				chunk: 4,
				packetType: "mixed",
				windowIdBits: 2,
				payload: {
					primary: {
						typeId: 0,
						parentTypeId: null,
						bitTemplate: this.unitBitTemplate[0]
					},
					secondary: null
				}
			},

			22: {
				command: 22,
				binary: 0b00000001,
				parser: "deviceList",
				chunk: 12,
				packetType: "pure",
				windowIdBits: 4,
				payload: {
					primary: {
						typeId: 3,
						parentTypeId: 0
					},
					secondary: {
						typeId: 4,
						parentTypeId: 3,
						chunkSize: 12
					}
				}
			},
			23: {
				command: 23,
				binary: 0b00000101,
				parser: "deviceData",
				chunk: 10,
				packetType: "pure",
				windowIdBits: 4,
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
						chunkSize: 10
					}
				}
			},
			24: {
				command: 24,
				binary: 0b00010010,
				hex: 0x18,
				parser: "deviceData",
				chunk: 8,
				packetType: "mixed",
				windowIdBits: 2,
				payload: {
					primary: {
						typeId: 3
					},
					secondary: null
				}
			},
			36: {
				command: 36,
				parser: "deviceData",
				hex: 0x24,
				chunk: 10,
				packetType: "mixed",
				payload: {
					primary: {
						typeId: 5,
						parentTypeId: null,
						bitTemplate: this.unitBitTemplate[5]
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
			//Device type (us=1 ds=0),NA,NA,NA,ELT,cable fault,7 min fired, 2min fired
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
		return [
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
	}

	get warnables() {
		return {
			cableFault: 1,
			earthLeakage: 1,
			mains: 0,
			lowBat: 1,
			shaftFault: 1
		};
	}
}

module.exports = IncomingCommTemplate;
