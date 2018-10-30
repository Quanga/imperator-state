class PacketModel {
	constructor(packetTemplate, packet, position) {
		//AVAILABLE IN PACKET
		const PacketUtils = require("../utils/packet_utils");
		this._util = new PacketUtils();
		this.template = packetTemplate;
		const { primary, secondary } = this.template.payload;

		this.command = parseInt(packetTemplate.binary, 16);
		this.typeId = position === 0 ? primary.typeId : secondary.typeId;
		this.parentType =
			position === 0 ? primary.parentTypeId : secondary.parentTypeId;
		this.windowId = position;

		this.parentId = null;
		this.parentSerial = null;
		this.data2 = null;

		if (position === 0) {
			this.complete = packet;
			this.start = packet.substr(0, 4);
			this.length = packet.substr(4, 2);
			this.command = packet.substr(6, 2);
			this.serial = packet.substr(8, 4);
			this.crc = packet.substr(12 + this._dataLen);
			this.rawData = packet.substr(12, this._dataLen);

			//process the edd info
		} else {
			this.rawData = packet;
			this.data = packet;
			this.serial = packet;
			//this.rawData = null;
		}

		switch (this.typeId) {
		case 3:
			if (this.command === 5) {
				let splitDataDelayWindow = this._util.extractCbbData(this.rawData);
				this.data = splitDataDelayWindow.cbbData;
				this.windowId = parseInt(splitDataDelayWindow.window, 2);
				this.data2 = splitDataDelayWindow.crc;
			}
			break;
		case 4:
			if (this.command === 5) {
				let splitDataDelayWindow = this._util.extractEddData(this.rawData);
				this.data = splitDataDelayWindow.eddData;
				this._windowId = parseInt(splitDataDelayWindow.window, 2);
				this.crc = splitDataDelayWindow.crc;
				this.data2 = splitDataDelayWindow.delay;
				this.serial = null;
			} else {
				let splitWindowData = this._util.extractEddWindow(this.rawData);
				this._serial = parseInt(splitWindowData.ip, 16);
				this._windowId = parseInt(splitWindowData.window, 2);
			}
			break;
		default:
			this.data = packet.substr(12, this._dataLen);
			break;
		}

		// this.res = JSON.parse(JSON.stringify(this, null, 4));
		// this.res.template = null;
		// console.log("etracted packet", JSON.stringify(this.res, null, 2));
	}

	get start() {
		return this._start;
	}

	set start(value) {
		this._start = value;
	}

	set length(value) {
		this._length = parseInt(value, 16);
		this._dataLen = this._length * 2 - (4 + 2 + 2 + 4) - 4;
	}

	get command() {
		return this._command;
	}
	set command(value) {
		this._command = parseInt(value, 16);
	}

	set crc(value) {
		this._crc = this._util.hexToBinaryString(value, 16);
	}

	get serial() {
		return this._serial;
	}
	set serial(value) {
		if (value !== null) {
			this._serial = parseInt(value, 16);

			if (this.typeId === 2) {
				let reversed = this._util.reverseSerialBytes(this.serial);
				this._serial = reversed;
			}
		} else {
			this._serial = null;
		}
	}

	get parentSerial() {
		return this._parentSerial;
	}
	set parentSerial(value) {
		this._parentSerial = value;
		if (this.typeId === 0) {
			this._parentSerial = null;
		}
	}

	get data() {
		return this._data;
	}

	set data(value) {
		this._data = value;

		switch (this.command) {
		case 5:
			if (this.typeId === 3) {
				this._data =
						this._data != null
							? this._util.extractCbbRawData(this.rawData)
							: null;
				//this.led_state =
				//	this.ledData != null ? this.ledData.toString() : null;
			} else {
				this._data =
						this._data != null
							? this._util.extractEddRawData(this.rawData)
							: null;
			}
			break;

		case 8:
			this._data =
					this._data != null
						? this._util.extractControlUnitData(this.rawData)
						: null;
			break;

		default:
			this._data =
					this._data != null
						? this._util.extractPacketData(this.rawData)
						: null;
			break;
		}
	}

	get data2() {
		return this._data2;
	}

	set data2(value) {
		if (this.typeId === 4) {
			this._data2 = parseInt(value, 16);
			let reversed = this._util.reverseSerialBytes(this._data2);
			this._data2 = reversed;
		} else {
			this._data2 = value;
		}
	}

	get windowId() {
		return this._windowId;
	}

	set windowId(value) {
		if (
			(this.command === 2 || this.command === 4 || this.command === 5) &&
			value != null
		) {
			this._windowId = value;
		} else {
			this._windowId = null;
		}

		if (this.typeId === 0) {
			this._windowId = 0;
		}
	}
}

module.exports = PacketModel;
