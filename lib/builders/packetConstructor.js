//there are 2 categories of packets
//1. list packets
//2. data packets
const { packTo } = require("byte-data");
const PacketUtils = require("../utils/packet_utils");

class PacketContructor {
	constructor(command, parentSerial, data) {
		this.utils = new PacketUtils();

		this.ready = "AAAA";

		this.command = command
			.toString()
			.toString("hex")
			.padStart(2, "0");

		this.serial = parentSerial
			.toString(16)
			.toString("hex")
			.padStart(4, "0");

		this.data = [];

		this.length = "00";
		this.crc = "0000";

		this.setData(command, data.data);
	}

	setData(command, data) {
		let rawData = null;

		switch (command) {
		case 1:
			//data should be a list of ISC serials
			rawData = data.map(ser => {
				return ser
					.toString(16)
					.toString("hex")
					.padStart(4, "0");
			});
			this.data = rawData.join("");
			break;
		case 2:
			//data should be a list of 651 serials
			rawData = data.map(ser => {
				ser = ser * 256;
				return ser
					.toString(16)
					.toString("hex")
					.padStart(4, "0");
			});

			this.data = rawData.join("");
			break;
		case 3:
			//data should be a list DATA
			rawData = data.map(item => {
				let joinedData = item.reverse().join("");
				let rawData = joinedData.toString(2).padStart(8);

				let parsed = parseInt(rawData, 2)
					.toString(16)
					.toString("hex")
					.padEnd(4, "0");

				return parsed;
			});

			this.data = rawData.join("");
			break;
		case 4:
			//data should be a list of CBB and EDD
			if (data.length > 0) {
				rawData = data.map(ser => {
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
				});

				this.data = rawData.join("");
			} else {
				this.data = "";
			}
			break;
		case 5:
			//data should be a list DATA
			rawData = data.map((ser, index) => {
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
			});
			this.data = rawData.join("");
			break;
		case 8:
			//data should be control unit data
			data.reverse();
			rawData = data.join("");
			this.data = parseInt(rawData, 2)
				.toString(16)
				.toString("hex")
				.padStart(4, "0");
			break;
		}
		this.buildPacket();
	}

	buildPacket() {
		this.length = this.utils
			.calculatePacketLength(this.command, this.serial, this.data)
			.padStart(2, "0");

		let preCrc =
			this.ready + this.length + this.command + this.serial + this.data;
		this.crc = this.utils
			.generateCRC(preCrc)
			.toString(16)
			.padStart(4, "0");

		this.packet =
			this.ready +
			this.length +
			this.command +
			this.serial +
			this.data +
			this.crc;
	}
}

module.exports = PacketContructor;
