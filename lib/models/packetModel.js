/* eslint-disable no-mixed-spaces-and-tabs */
const PacketUtils = require("../utils/packet_utils");

class PacketModel {
	constructor(packetObject) {
		this.util = new PacketUtils();
		const { pos, created, packetSerial } = packetObject;
		this.template = packetObject.packetTemplate;

		const { primary, secondary } = this.template.payload;

		this.data = {
			created: created,
			serial: null,
			typeId: pos === 0 ? primary.typeId : secondary.typeId,
			parentSerial: null,
			parentType: pos === 0 ? primary.parentTypeId : secondary.parentTypeId,
			command: this.template.command
		};

		if (pos === 0) {
			this.data.serial = packetSerial;
		} else {
			this.data.parentSerial = packetSerial;
		}
	}
}

class PacketModelList extends PacketModel {
	constructor(packetObject) {
		super(packetObject);
		const { packet } = packetObject;

		switch (this.template.command) {
		case 1:
			if (packet) this.data.serial = parseInt(packet.substr(2, 2), 16);
			break;
			// case 3:
			// 	this.data.childCount = 0;
			// 	break;

		case 4:
			if (this.data.typeId === 4) {
				this.data = {
					...this.data,
					...this.extractEDDListData(packet)
				};
			}
			break;
		case 22:
			if (this.data.typeId === 4) {
				this.data = {
					...this.data,
					...this.extractEDDListData(packet, true)
				};
			}
		}
	}

	extractEDDListData(rawData, extended) {
		return {
			serial: parseInt(rawData.substr(0, 8), 16),
			windowId: extended
				? this.util.reverseSerialBytes(parseInt(rawData.substr(8, 4), 16))
				: parseInt(rawData.substr(8, 2), 16)
		};
	}
}

class PacketModelData extends PacketModel {
	constructor(packetObject) {
		super(packetObject);
		const { packet, pos } = packetObject;

		switch (this.template.command) {
		case 3:
			this.data = { ...this.data, ...this.extractIBS(packet) };

			if (this.data.typeId === 2) {
				this.data.windowId = pos;
			}
			break;
		case 5:
			if (this.data.typeId === 3) {
				this.data = { ...this.data, ...this.extractCbbRawData(packet) };
			}

			if (this.data.typeId === 4) {
				this.data = { ...this.data, ...this.extractEddRawData(packet) };
			}
			break;

		case 23:
			if (this.data.typeId === 3) {
				this.data = { ...this.data, ...this.extractCbbRawData(packet, true) };
			}

			if (this.data.typeId === 4) {
				this.data = { ...this.data, ...this.extractEddRawData(packet, true) };
			}
			break;
		case 8:
			this.data = { ...this.data, ...this.extractControlUnit(packet) };
			break;
		}
	}
	extractControlUnit(rawData) {
		return {
			data: rawData ? this.convertRaw(rawData, 2, 2, 8, 2) : null
		};
	}

	extractIBS(rawData) {
		return { data: rawData ? this.convertRaw(rawData, 0, 2, 8, 2) : null };
	}

	extractCbbRawData(rawData, extendWindowId) {
		let offset = 0;
		if (extendWindowId) {
			offset = 2;
		}
		const childCount = rawData
			? parseInt(rawData.substr(0, 2 + offset), 16)
			: 0;
		const ledState = rawData
			? parseInt(rawData.substr(4 + offset, 1), 16)
			: null;
		const data = rawData
			? this.convertRaw(rawData.substr(5 + offset, 3), 0, 3, 16, 8)
			: null;

		return {
			childCount: childCount ? childCount : 0,
			ledState: ledState ? ledState : null,
			data: data ? data : null
		};
	}

	extractEddRawData(rawData, extendWindowId) {
		let offset = 0;
		if (extendWindowId) {
			offset = 2;
		}

		return {
			windowId: !extendWindowId
				? parseInt(rawData.substr(0, 2), 16)
				: this.util.reverseSerialBytes(
					parseInt(rawData.substr(0, 2 + offset), 16)
				  ),
			data: this.convertRaw(rawData.substr(2 + offset, 2), 0, 8, 8, 2),
			delay: this.util.reverseSerialBytes(
				parseInt(rawData.substr(4 + offset, 4), 16)
			)
		};
	}

	convertRaw(data, from, length, pad, rad) {
		let rawData = this.util.hexToBinaryString(data.substr(from, length), pad);
		let result = rawData.split("");
		let resultArr = result.map(v => parseInt(v, rad));
		return resultArr;
	}
}

module.exports = { PacketModelList, PacketModelData };
