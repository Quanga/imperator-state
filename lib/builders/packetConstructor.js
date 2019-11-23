const { packTo } = require("byte-data");
const CRC = require("../utils/crc");

class PacketContructor {
	constructor() {}

	static withCommand(command) {
		const packetConstructor = new PacketContructor();
		packetConstructor.constants = require("../configs/packets/packetCommands").constants;
		packetConstructor.command = packetConstructor.formatCommand(command);

		return packetConstructor;
	}

	withParent(parentSerial) {
		this.serial = this.formatSerial(parentSerial);
		return this;
	}

	withData(data = []) {
		this.data = this.setData(this.command, data);
		return this;
	}

	build() {
		this.packet = this.buildPacket();
		return this.packet;
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
			case "01": {
				return data
					.map(ser => {
						return ser
							.toString(16)
							.toString("hex")
							.padStart(4, "0");
					})
					.join("");
			}
			case "02": {
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
			case "03": {
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
			case "04": {
				//data should be a list of CBB and EDD
				if (data.length > 0) {
					return data
						.map(ser => {
							const serial = ser.serial
								.toString(16)
								.toString("hex")
								.padStart(8, "0");

							const windowId = ser.windowId
								.toString(16)
								.toString("hex")
								.padStart(2, "0");

							const combined = serial + windowId;

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
			case "05": {
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
			case "08": {
				data.reverse();
				let rawData = data.join("");
				return parseInt(rawData, 2)
					.toString(16)
					.toString("hex")
					.padStart(4, "0");
			}
			default:
				throw new Error("No command listed");
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
