class IncomingCommTemplate {
	constructor() {}

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
				packetType: "mixed",
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
					partialBlast: { index: 6 },
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
			"mains",
			"lowBat"
		];
		// return {
		// 	blastArmed: {
		// 		default: {
		// 			0: (serial, type) =>
		// 				`${this.loggableTypes[type]}: SN ${serial} Blast Disarmed`,
		// 			1: (serial, type) =>
		// 				`${this.loggableTypes[type]}: SN ${serial} Blast Armed`
		// 		}
		// 	},
		// 	communicationStatus: {
		// 		default: {
		// 			0: (serial, type) =>
		// 				`${
		// 					this.loggableTypes[type]
		// 				}: SN ${serial} communication status is OFF`,
		// 			1: (serial, type) =>
		// 				`${
		// 					this.loggableTypes[type]
		// 				}: SN ${serial} communication status is ON`
		// 		}
		// 	},
		// 	keySwitchStatus: {
		// 		default: {
		// 			0: (serial, type) =>
		// 				`${this.loggableTypes[type]}: SN ${serial} key Switch is OFF`,
		// 			1: (serial, type) =>
		// 				`${this.loggableTypes[type]}: SN ${serial} key Switch is ON`
		// 		}
		// 	},
		// 	fireButton: {
		// 		0: {
		// 			0: (serial, type) =>
		// 				`${this.loggableTypes[type]}: SN ${serial} key switch not Pressed`,
		// 			1: (serial, type) =>
		// 				`${this.loggableTypes[type]}: SN ${serial} key switch Pressed`
		// 		}
		// 	},
		// 	isolationRelay: {
		// 		default: {
		// 			0: (serial, type) =>
		// 				`${this.loggableTypes[type]}: SN ${serial} isolation relay is OFF`,
		// 			1: (serial, type) =>
		// 				`${this.loggableTypes[type]}: SN ${serial} isolation relay is ON`
		// 		}
		// 	},
		// 	dcSupplyVoltage: {
		// 		default: {
		// 			0: (serial, type) =>
		// 				`${this.loggableTypes[type]}: SN ${serial} dcSupplyVoltage is OFF`,
		// 			1: (serial, type) =>
		// 				`${this.loggableTypes[type]}: SN ${serial} dcSupplyVoltage is ON`
		// 		}
		// 	},
		// 	cableFault: {
		// 		default: {
		// 			0: (serial, type) =>
		// 				`${this.loggableTypes[type]}: SN ${serial} No Cable Fault Detected`,
		// 			1: (serial, type) =>
		// 				`${this.loggableTypes[type]}: SN ${serial} Cable Fault Detected`
		// 		}
		// 	},
		// 	earthLeakage: {
		// 		default: {
		// 			0: (serial, type) =>
		// 				`${this.loggableTypes[type]}: SN ${serial} No Earth Leakage Fault`,
		// 			1: (serial, type) =>
		// 				`${
		// 					this.loggableTypes[type]
		// 				}: SN ${serial} Earth Leakage Fault Detected`
		// 		}
		// 	},
		// 	boosterFired: {
		// 		default: {
		// 			0: (serial, type) =>
		// 				`${
		// 					this.loggableTypes[type]
		// 				}: SN ${serial} booster fire message false`,
		// 			1: (serial, type) =>
		// 				`${
		// 					this.loggableTypes[type]
		// 				}: SN ${serial} booster fire message true`
		// 		}
		// 	},
		// 	mains: {
		// 		default: {
		// 			0: (serial, type) =>
		// 				`${this.loggableTypes[type]}: SN ${serial} Power Supply Connected`,
		// 			1: (serial, type) =>
		// 				`${this.loggableTypes[type]}: SN ${serial} Power Supply Error`
		// 		}
		// 	},
		// 	lowBat: {
		// 		default: {
		// 			0: (serial, type) =>
		// 				`${this.loggableTypes[type]}: SN ${serial} Battery Charged`,
		// 			1: (serial, type) =>
		// 				`${this.loggableTypes[type]}: SN ${serial} Low Battery Detected`
		// 		}
		// 	}
		// };
	}

	get warnables() {
		return ["cableFault", "earthLeakage", "boosterFired", "mains", "lowBat"];
		// return {
		// 	cableFault: {
		// 		default: {
		// 			0: (serial, type) =>
		// 				`${this.loggableTypes[type]}: SN ${serial} : Cable fault Restored`,
		// 			1: (serial, type) =>
		// 				`${
		// 					this.loggableTypes[type]
		// 				}: SN ${serial} : Cable fault detected, unit will not fire until the fault is isolated or corrected`
		// 		},
		// 		3: {
		// 			0: (serial, type) =>
		// 				`${this.loggableTypes[type]}: SN ${serial} : Cable fault Restored`,
		// 			1: (serial, type) =>
		// 				`${
		// 					this.loggableTypes[type]
		// 				}: SN ${serial} : Cable fault to EDDs detected, will not fire any EDDs`
		// 		}
		// 	},
		// 	earthLeakage: {
		// 		default: {
		// 			0: (serial, type) =>
		// 				`${
		// 					this.loggableTypes[type]
		// 				}: SN ${serial} Earth leakage fault corrected`,
		// 			1: (serial, type) =>
		// 				`${
		// 					this.loggableTypes[type]
		// 				}: SN ${serial} : Earth leakage fault detected, unit will not fire until fault is isolated or corrected`
		// 		},
		// 		1: {
		// 			0: (serial, type) =>
		// 				`${
		// 					this.loggableTypes[type]
		// 				}: SN ${serial} Earth leakage fault corrected`,
		// 			1: (serial, type) =>
		// 				`${
		// 					this.loggableTypes[type]
		// 				}: SN ${serial} : Section earth leakage fault detected, downstream units isolated and will not fire until fault is isolated or corrected`
		// 		},
		// 		3: {
		// 			0: (serial, type) =>
		// 				`${
		// 					this.loggableTypes[type]
		// 				}: SN ${serial} Earth leakage fault corrected`,
		// 			1: (serial, type) =>
		// 				`${
		// 					this.loggableTypes[type]
		// 				}: SN ${serial} : Section earth leakage fault detected, downstream units isolated and will not fire until fault is isolated or corrected`
		// 		}
		// 	},
		// 	boosterFired: {
		// 		default: {
		// 			0: (serial, type) =>
		// 				`${this.loggableTypes[type]}: SN ${serial} booster not fired`,
		// 			1: (serial, type) =>
		// 				`${this.loggableTypes[type]}: SN ${serial} booser fired message`
		// 		}
		// 	},
		// 	mains: {
		// 		default: {
		// 			0: (serial, type) =>
		// 				`${this.loggableTypes[type]}: SN ${serial} : Power Restored`,
		// 			1: (serial, type) =>
		// 				`${
		// 					this.loggableTypes[type]
		// 				}: SN ${serial} : Power outage, unit operating on battery backup`
		// 		}
		// 	},
		// 	lowBat: {
		// 		default: {
		// 			0: (serial, type) =>
		// 				`${this.loggableTypes[type]}: SN ${serial} Battery Restored`,
		// 			1: (serial, type) =>
		// 				`${
		// 					this.loggableTypes[type]
		// 				}: SN ${serial} : Low battery detected, failure to charge may result in blast failure. There is 1 hour left until the battery is depleted`
		// 		}
		// 	}
		// };
	}
}

module.exports = IncomingCommTemplate;
