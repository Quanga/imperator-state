/* eslint-disable no-prototype-builtins */
const fields = require("../configs/fields/fieldConstants");
const { createdAt, typeId, serial, parentType, parentSerial } = fields;

const IpToInt = require("ip-to-int");

const { payloads } = require("../configs/packets/packetCommands");
const unitSchema = require("../configs/units/unitSchema");

class Parser {
	static create() {
		const parser = new Parser();

		return parser;
	}

	withMode(mode) {
		if (!mode || !Object.prototype.hasOwnProperty.call(mode, "constraints"))
			throw new Error("Mode object missing constraints");

		this.mode = mode;
		return this;
	}

	withPacket(packetObj) {
		if (!packetObj) throw new Error("Packet Object must be supplied to create Parser");
		if (!Object.prototype.hasOwnProperty.call(packetObj, "packet"))
			throw new Error("Packet object missing packet");
		if (!Object.prototype.hasOwnProperty.call(packetObj, "createdAt"))
			throw new Error("Packet object missing createdAt");

		const { packet } = packetObj;

		this.packet = packet;
		this.command = parseInt(this.packet.substr(6, 2), 16);
		this.template = payloads[this.command];
		this[createdAt] = packetObj[createdAt];
		this[serial] = this.hexToDec(packet.substr(8, 4));
		this[typeId] = this.template.format.primary.typeId;

		return this;
	}

	extractPayload() {
		const { chunk, format } = this.template;

		const length = parseInt(this.packet.substr(4, 2), 16) * 2 - 16;
		const data = this.packet.substr(12, length);

		if (data.length % chunk !== 0) throw new Error("Packet cannot be correctly chunked");

		const chunkSize = new RegExp(`.{1,${chunk}}`, "g");
		const dataChunks = data.match(chunkSize);

		let pos = 0;
		this.rawData = [];

		if (format.primary.hasOwnProperty("structure")) {
			this.rawData.push({ type: "primary", data: dataChunks[0] });
			pos++;
		} else {
			this.rawData.push({ type: "primary", data: null });
		}

		if (format.hasOwnProperty("secondary") && format.secondary.hasOwnProperty("structure")) {
			for (let index = pos; index < dataChunks.length; index++) {
				this.rawData.push({ type: "secondary", data: dataChunks[index] });
			}
		}
	}

	parsePayloadData() {
		const { command } = this;

		this.data = this.rawData.map((el) => {
			const element = payloads[command].format[el.type];
			if (element.hasOwnProperty("structure") && element.structure.hasOwnProperty("data")) {
				return this.extractData(element.structure.data, el);
			}
		});
	}

	parsePayloadMeta() {
		const { command } = this;
		this.meta = this.rawData.map((el) => {
			const element = payloads[command].format[el.type];
			if (element.hasOwnProperty("structure") && element.structure.hasOwnProperty("meta")) {
				return this.extractMeta(element.structure.meta, el);
			}

			return this.extractTypeInfo(el);
		});
	}

	extractTypeInfo(item) {
		const { command } = this;
		const res = {
			[createdAt]: this[createdAt],
			[typeId]: payloads[command].format[item.type][typeId],
			[parentType]: unitSchema[this.typeId][parentType],
		};

		if (item.type === "primary") {
			res[serial] = this[serial];
		} else {
			res[parentType] = this[typeId];
			res[parentSerial] = this[serial];
		}
		return res;
	}

	extractData(structure, element) {
		return Object.keys(structure)
			.map((structureKey) => {
				let keyData = element.data.substr(
					structure[structureKey].start,
					structure[structureKey].length,
				);

				if (structureKey === "bits") {
					keyData = this.extractBits(structure[structureKey].format.bits, keyData);

					return { ...keyData };
				} else if (structure[structureKey].hasOwnProperty("format")) {
					let formats = [];

					if (Array.isArray(structure[structureKey].format)) {
						formats = structure[structureKey].format;
					} else {
						const maxDets = this.mode.constraints.maxDetLoad;
						formats = structure[structureKey].format[maxDets];
					}

					formats.forEach((format) => {
						keyData = this[format](keyData);
					});
				}

				return { [structureKey]: keyData };
			})
			.reduce((acc, cur) => {
				const item = { ...acc, ...cur };
				return item;
			}, {});
	}

	extractMeta(structure, element) {
		return Object.keys(structure)
			.map((structureKey) => {
				let keyData = element.data.substr(
					structure[structureKey].start,
					structure[structureKey].length,
				);

				if (structure[structureKey].hasOwnProperty("format")) {
					let formats = [];

					if (Array.isArray(structure[structureKey].format)) {
						formats = structure[structureKey].format;
					} else {
						const maxDets = this.mode.constraints.maxDetLoad;
						formats = structure[structureKey].format[maxDets];
					}

					formats.forEach((format) => {
						keyData = this[format](keyData);
					});
				}

				const typeInfo = this.extractTypeInfo(element);

				return {
					[structureKey]: keyData,
					...typeInfo,
				};
			})
			.reduce((acc, cur) => {
				const item = { ...acc, ...cur };
				return item;
			}, {});
	}

	hexToDec(data) {
		return parseInt(data, 16);
	}

	toDec(data) {
		return parseInt(data, 10);
	}

	hexToPercent(data) {
		return Math.floor((data / 255) * 100);
	}

	toIP(num) {
		const serial = num.toString();
		return IpToInt(serial).toIP();
	}

	reverseSerialBytes(serialOriginal) {
		const over = serialOriginal % 256;
		if (!over) return serialOriginal / 256;
		return (serialOriginal - over) / 256 + 256 * over;
	}

	extractBits(bitTemplate, data) {
		const bitKeys = Object.keys(bitTemplate);
		let bitData = parseInt(data, 16)
			.toString(2)
			.padStart(bitKeys.length, "0")
			.split("")
			.reduce((acc, cur, index) => {
				if (!bitTemplate[index]) return acc;

				acc[bitTemplate[index]] = parseInt(cur, 2);
				return acc;
			}, {});

		return bitData;
	}

	checkSignal() {
		const { template } = this;

		if (template.hasOwnProperty("signals")) {
			const signalKeys = Object.keys(template.signals);

			signalKeys.forEach((signal) => {
				if (template.signals[signal].hasOwnProperty("conditions")) {
					if (template.signals[signal].conditions.length) {
						if (this.data.length === template.signals[signal].conditions.length) {
							const structureKeys = Object.keys(template.signals[signal].structure);

							structureKeys.forEach((structureKey, index) => {
								for (const key in template.signals[signal].structure[structureKey]) {
									if (this.meta[index].hasOwnProperty(key)) {
										if (this.meta[key] !== template.signals[signal].structure[structureKey]) return null;
									}
								}
							});
							this.signal = signal;
						}
					}
				}
			});
		}
	}

	build() {
		this.extractPayload();
		this.parsePayloadData();
		this.parsePayloadMeta();
		this.checkSignal();

		this.results = this.data.map((data, i) => {
			return { data: { ...data }, meta: { ...this.meta[i] } };
		});

		return this;
	}
}

module.exports = Parser;
