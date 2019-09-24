/* eslint-disable no-mixed-spaces-and-tabs */
const Extractors = require("./extractors");
const modes = require("../constants/modeTemplates");

class PacketModel {
	constructor(packetObject) {
		const valid = this.validatePacket(packetObject);

		if (valid) {
			this.extractors = new Extractors();
			const { pos, createdAt, packetSerial, packetTemplate, packet } = packetObject;

			this.template = packetTemplate;
			const { primary, secondary } = this.template.payload;

			this.data = {
				createdAt,
				serial: null,
				typeId: pos === 0 ? primary.typeId : secondary.typeId,
				parentSerial: null,
				parentType: pos === 0 ? primary.parentTypeId : secondary.parentTypeId,
				command: this.template.command,
				packet
			};

			if (pos === 0) {
				this.data.serial = packetSerial;
			} else {
				this.data.parentSerial = packetSerial;
			}
		}
	}

	validatePacket(packetObject) {
		if (!packetObject) throw new Error("An object must be supplied, received null or undefined");

		if (typeof packetObject !== "object" || packetObject.constructor !== Object)
			throw new Error("Packet must be suppled as an Object");

		const requiredArgs = ["createdAt", "packetTemplate", "packet"];

		const errArr = [];
		requiredArgs.forEach(arg => {
			if (!packetObject.hasOwnProperty(arg)) errArr.push(arg);
		});

		if (errArr.length > 0) {
			let errorMsg = "";

			errArr.forEach(
				(msg, index) => (errorMsg = errorMsg.concat(msg + (index < errArr.length - 1 ? ", " : "")))
			);
			throw new Error(`The Object is missing properties - ${errorMsg}`);
		}

		if (packetObject.packet !== null && typeof packetObject.packet !== "string")
			throw new Error("Packet must be an string");

		if (!packetObject.packetTemplate || !packetObject.packetTemplate.payload)
			throw new Error("Incorrect packet template object");

		return true;
	}
}

class PacketModelList extends PacketModel {
	constructor(packetObject) {
		super(packetObject);
		const { packet } = packetObject;

		switch (this.template.command) {
		case 1:
			this.data.serial = parseInt(packet.substr(2, 2), 16);
			break;
		case 4:
			if (this.data.typeId === 4) {
				this.data = {
					...this.data,
					...this.extractors.extractEDDListData(packet)
				};
			}
			break;
		case 22:
			if (this.data.typeId === 4) {
				this.data = {
					...this.data,
					...this.extractors.extractEDDListData(packet, true)
				};
			}
		}
	}
}

class PacketModelData extends PacketModel {
	constructor(packetObject) {
		super(packetObject);
		const { packet, pos } = packetObject;

		switch (this.template.command) {
		case 3:
			this.data = { ...this.data, ...this.extractors.extractIBS(packet) };

			if (this.data.typeId === 2) {
				this.data.windowId = pos;
			}
			break;
		case 5:
			if (this.data.typeId === 3) {
				let extended = false;
				//TODO fix here
				if (modes[process.env.MODE].extendedWindowId) extended = true;

				this.data = { ...this.data, ...this.extractors.extractCbbRawData(packet, extended) };
			}

			if (this.data.typeId === 4) {
				this.data = { ...this.data, ...this.extractors.extractEddRawData(packet) };
			}
			break;

		case 23:
			if (this.data.typeId === 3) {
				this.data = { ...this.data, ...this.extractors.extractCbbRawData(packet, true) };
			}

			if (this.data.typeId === 4) {
				this.data = { ...this.data, ...this.extractors.extractEddRawData(packet, true) };
			}
			break;
		case 8:
			this.data = { ...this.data, ...this.extractors.extractControlUnit(packet) };
			break;

		case 24:
			this.data = { ...this.data, ...this.extractors.extractWifi(packet) };
			break;

		case 36:
			this.data = { ...this.data, ...this.extractors.extractCFC(packet) };
			break;
		}
	}
}

module.exports = { PacketModelList, PacketModelData };
