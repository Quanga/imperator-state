class PacketModel {
	//constructor(packetTemplate, packet, created, pos)
	constructor(opts) {
		if (!opts) throw new Error("options must be  supplied");

		if (arguments.length > 1) {
			throw new Error("only one argument object to be supplied");
		}
		if (!opts.created) {
			throw new Error("created is not supplied");
		}
		if (opts.pos === undefined || typeof opts.pos != "number") {
			throw new Error("no position reference provided");
		}
		if (!opts.packet || typeof opts.packet !== "string") {
			throw new Error("packet format is missing or not a string");
		}
		if (!opts.packetTemplate || typeof opts.packetTemplate !== "object") {
			throw new Error("packetTemplate is not provided");
		}

		const PacketUtils = require("../utils/packet_utils");
		this._util = new PacketUtils();

		this.created = opts.created;
		this.template = opts.packetTemplate;

		const { primary, secondary } = this.template.payload;
		this.typeId = opts.pos === 0 ? primary.typeId : secondary.typeId;
		this.parentType =
      opts.pos === 0 ? primary.parentTypeId : secondary.parentTypeId;
		this.command = parseInt(opts.packetTemplate.binary, 16);

		this.windowId = opts.pos;

		this.parentId = null;
		this.parentSerial = null;
		this.data2 = null;
		this.command = this.template.command;

		if (opts.pos === 0) {
			this.complete = opts.packet;
			this.length = opts.packet.substr(4, 2);
			this.serial = opts.packet.substr(8, 4);
			this.rawData = opts.packet.substr(12, this._dataLen);
		} else {
			this.rawData = opts.packet;
			this.serial = opts.packet;
		}

		//special case for CBB and EDD data extraction, this is why it is in the constructor
		switch (this.typeId) {
		case 1:
			if (this.command === 3) {
				this.data = this.rawData.substr(0, 2);

				if (this.rawData.length > 4) {
					let iscRemoved = this.rawData.slice(4);
					this.rawData = iscRemoved;
				} else {
					this.rawData = null;
				}
			}
			break;
		case 3:
			if (this.command === 5) {
				//this is a data command
				let cbbDPacket = this.rawData.substr(0, 8);
				this.windowId = parseInt(cbbDPacket.substr(0, 2), 16);
				this.led_state = parseInt(cbbDPacket.substr(4, 1), 16);
				let extraCbbData = cbbDPacket.substr(5, 3);
				this.data = extraCbbData;

				if (this.rawData.length > 8) {
					let cbbRemoved = this.rawData.slice(8);
					this.rawData = cbbRemoved;
				} else {
					this.rawData = null;
				}
			}

			if (this.command === 22) {
				this._windowId = parseInt(this.rawData.substr(8, 4), 16) / 256;
			}

			if (this.command === 23) {
				//this is a data command

				let cbbDPacket = this.rawData.substr(0, 8);
				this.windowId = parseInt(cbbDPacket.substr(0, 4), 16);
				this.led_state = parseInt(cbbDPacket.substr(4, 1), 16);
				let extraCbbData = cbbDPacket.substr(5, 3);
				this.data = extraCbbData;

				if (this.rawData.length > 8) {
					let cbbRemoved = this.rawData.slice(8);
					this.rawData = cbbRemoved;
				} else {
					this.rawData = null;
				}
			}
			break;
		case 4:
			//if this is a data command
			if (this.command === 5) {
				this._windowId = parseInt(this.rawData.substr(0, 2), 16);
				this.data = this.rawData.substr(2, 2);
				this.data2 = this.rawData.substr(4, 4);
				this.serial = null;
			} else if (this.command === 4) {
				//if this is a list command
				let extractedIp = this.rawData.substr(0, 8); //first 8 hex charactes are the ip
				this._serial = parseInt(extractedIp, 16);
				this._windowId = parseInt(this.rawData.substr(8, 2), 16);
			} else if (this.command === 23) {
				this._windowId = parseInt(this.rawData.substr(0, 4), 16);
				this.data = this.rawData.substr(4, 2);
				this.data2 = this.rawData.substr(6, 4);
				this.serial = null;
			} else if (this.command === 22) {
				let extractedIp = this.rawData.substr(0, 8); //first 8 hex charactes are the ip
				this._serial = parseInt(extractedIp, 32);
				this._windowId = parseInt(this.rawData.substr(8, 4), 16) / 256;
			}
			break;
		default:
			if (this.command === 22 || this.command === 3 || this.command === 8) {
				if (this.typeId === 2 || this.typeId === 0) {
					this.data = this.rawData;
				}
			}
			break;
		}
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
		this._parentSerial = this.typeId === 0 ? null : value;
	}

	get data() {
		return this._data;
	}
	//setting of the data handle the extraction of the data
	set data(value) {
		this._data = this.parseData(value);
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
			(this.command === 2 ||
        this.command === 4 ||
        this.command === 5 ||
        this.command === 22 ||
        this.command === 23) &&
      value != null
		) {
			this._windowId = value;
		} else {
			this._windowId = null;
		}

		if (this.typeId === 0) {
			this._windowId = null;
		}
	}

	parseData(data) {
		if (data === null) {
			return null;
		}

		let resultArr = null;
		switch (this.command) {
		case 5:
			resultArr =
          this.typeId === 3
          	? this.convertRaw(data, 0, 3, 16, 8)
          	: this.convertRaw(data, 0, 8, 8, 2);
			break;
		case 23:
			resultArr =
          this.typeId === 3
          	? this.convertRaw(data, 0, 3, 16, 8)
          	: this.convertRaw(data, 0, 8, 8, 2);
			break;

		case 8:
			resultArr = this.convertRaw(data, 2, 2, 8, 2);
			break;

		default:
			resultArr = this.convertRaw(data, 0, 2, 8, 2);
			break;
		}

		return resultArr;
	}

	convertRaw(data, from, length, pad, rad) {
		if (data === "") {
			return null;
		}

		let rawData = this._util.hexToBinaryString(data.substr(from, length), pad);
		let result = rawData.split("");
		let resultArr = result.map(v => parseInt(v, rad));
		return resultArr;
	}
}

module.exports = PacketModel;
