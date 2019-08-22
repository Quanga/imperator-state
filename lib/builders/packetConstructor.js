const { packTo } = require("byte-data");
const CRC = require("../utils/crc");
const Constants = require("../constants/packetTemplates");

class PacketContructor {
	constructor(command, parentSerial, data = { data: [] }) {
		if (arguments.length === 0)
			throw new Error("No arguments supplied, cannot create PacketConstructor");

		this.constants = new Constants().packetConstants;

		this.command = this.formatCommand(command);
		this.serial = this.formatSerial(parentSerial);
		this.data = this.setData(command, data.data);
		this.packet = this.buildPacket();
	}

	formatCommand(command) {
		return command
			.toString()
			.toString("hex")
			.padStart(2, "0");
	}

	formatSerial(serial) {
		return serial
			.toString(16)
			.toString("hex")
			.padStart(4, "0");
	}

	setData(command, data) {
		switch (command) {
		case 1: {
			return data
				.map(ser => {
					return ser
						.toString(16)
						.toString("hex")
						.padStart(4, "0");
				})
				.join("");
		}
		case 2: {
			return data
				.map(ser => {
					ser = ser * 256;
					return ser
						.toString(16)
						.toString("hex")
						.padStart(4, "0");
				})
				.join("");
		}
		case 3: {
			return data
				.map(item => {
					let joinedData = item.reverse().join("");
					let rawData = joinedData.toString(2).padStart(8);

					let parsed = parseInt(rawData, 2)
						.toString(16)
						.toString("hex")
						.padEnd(4, "0");

					return parsed;
				})
				.join("");
		}
		case 4: {
			//data should be a list of CBB and EDD
			if (data.length > 0) {
				return data
					.map(ser => {
						let serial = ser.serial
							.toString(16)
							.toString("hex")
							.padStart(8, "0");

						let windowId = ser.windowId
							.toString(16)
							.toString("hex")
							.padStart(2, "0");

						let combined = serial + windowId;

						return combined
							.toString(16)
							.toString("hex")
							.padStart(10, "0");
					})
					.join("");
			} else {
				return "";
			}
		}
		case 5: {
			return data
				.map((ser, index) => {
					if (index === 0) {
						let childCount = ser.childCount.toString(16).padStart(2, "0");
						let crc = "99";

						const result = parseInt(ser.rawData.join(""), 2)
							.toString(16)
							.toString("hex");

						return childCount + crc + ser.ledState + result;
					} else {
						let windowId = ser.windowId.toString(16).padStart(2, "0");

						let parsed = parseInt(ser.rawData.reverse().join(""), 2)
							.toString(16)
							.toString("hex")
							.padEnd(2, "0");

						let delay = new Buffer.alloc(2);
						packTo(ser.delay, { bits: 16 }, delay, 0);

						let combined = windowId + parsed + delay.toString("hex");
						return combined;
					}
				})
				.join("");
		}
		case 8: {
			data.reverse();
			let rawData = data.join("");
			return parseInt(rawData, 2)
				.toString(16)
				.toString("hex")
				.padStart(4, "0");
		}
		case 17:
			return "";
		case 18:
			return "";
		default:
			return "";
		}
	}

	buildPacket() {
		try {
			const packetLength = this.calculatePacketLength(this.data);
			const ready = this.constants.headerDelimiter;

			const preCrc = ready + packetLength + this.command + this.serial + this.data;
			const crc = CRC.generateCRC(preCrc)
				.toString(16)
				.padStart(4, "0");

			return ready + packetLength + this.command + this.serial + this.data + crc;
		} catch (err) {
			console.log(err);
		}
	}

	calculatePacketLength(data) {
		//if (!Array.isArray(data)) throw new Error("Data is not an array");

		let byteLen = (this.constants.total + data.length) / 2;
		return byteLen.toString(16).padStart(2, "0");
	}
}

module.exports = PacketContructor;
