/**
 * Created by grant on 2016/06/22.
 */

const PacketUtils = function() {
	const Constants = require("../constants/command_constants");
	this.__constants = new Constants();
};

PacketUtils.prototype.binaryToHexString = function(binString, padLen) {
	const result = parseInt(binString, 2).toString(16);
	return padLen ? this.pad(result, padLen) : result;
};

PacketUtils.prototype.hexToBinaryString = function(hexString, padLen) {
	const result = parseInt(hexString, 16).toString(2);
	return padLen ? this.pad(result, padLen) : result;
};

PacketUtils.prototype.calculatePacketLength = function(command, serial, data) {
	const startFieldLen = 4; // start field is always 4 hex chars
	const lengthFieldLen = 2; // length field is always 2 hex chars
	const crcFieldLen = 4; // crc field is always 4 hex chars

	// each 2 hex chars = 1 byte (ie: 8 bits)
	let len =
		startFieldLen +
		lengthFieldLen +
		command.length +
		serial.length +
		data.length +
		crcFieldLen;

	let byteLen = len / 2;

	// return the hex representation of the length
	return this.pad(byteLen.toString(16), 2);
};

/*
 CRC algorithm provided by AECE
 */
PacketUtils.prototype.generateCRC = function(data) {
	let hexArr = [];
	let strArr;

	switch (typeof data) {
	case "string":
		// if data is a string, then split this into an array of 2 chars each
		// (expect a string of hex chars, where 2 hex chars = 8 bits/1 byte)
		strArr = data.match(/.{1,2}/g);

		if (strArr == null) return "";

		// coerce each item in the array into a hex value and then into a decimal
		strArr.forEach(function(item) {
			hexArr.push(parseInt(item.toString(16), 16));
		});
		break;
	default:
		hexArr = data;
		break;
	}

	let numBytes = hexArr.length;
	let crc = 0xffff;
	let resultData = null;

	// iterate through the byte array
	for (let length = 0; length < numBytes; length++) {
		resultData = 0xff & hexArr[length];

		for (let i = 0; i < 8; i++) {
			if ((crc & 0x0001) ^ (resultData & 0x0001)) crc = (crc >> 1) ^ 0x8408;
			else crc >>= 1;
			resultData >>= 1;
		}
	}

	crc = ~crc;
	resultData = crc;
	crc = (crc << 8) | ((resultData >> 8) & 0xff);
	crc &= 0xffff;

	return crc;
};

PacketUtils.prototype.pad = function(str, len) {
	let start = "";

	while (start.length + str.length < len) {
		start += "0";
	}

	return start + str;
};

/*
 INCOMING PACKETS
 */

PacketUtils.prototype.splitPacket = function(packet) {
	let splitAsync = async () => {
		let start = packet.substr(0, 4);
		let length = packet.substr(4, 2);
		let command = packet.substr(6, 2);
		let serial = packet.substr(8, 4);
		let packetLen = parseInt(length, 16); // get the length
		let dataLen = packetLen * 2 - (4 + 2 + 2 + 4) - 4;
		let data = packet.substr(12, dataLen);
		let crc = packet.substr(12 + dataLen);

		console.log(
			`COMMAND ----${command}  packet ----${packet}   data ----${data}`
		);

		return {
			complete: packet,
			start: start,
			length: length,
			command: command,
			serial: serial,
			packetLen: packetLen,
			dataLen: dataLen,
			data: data,
			crc: crc
		};
	};
	return splitAsync();
};

PacketUtils.prototype.createPacketResult = function(
	packet,
	start,
	length,
	command,
	serial,
	data,
	crc,
	parent,
	parentType,
	pos,
	data2,
	isAxxis
) {
	let result = this.createPacketResultObject();

	result.complete = packet;
	result.start = this.hexToBinaryString(start, 16);
	result.length = this.hexToBinaryString(length, 8);
	result.command = this.hexToBinaryString(command, 8);

	switch (command) {
	case "05":
		if (isAxxis == 1) {
			result.data = data != null ? this.extractCbbRawData(data) : null;
			//result.led_state = ledData != null ? ledData.toString() : null;
		} else {
			result.data = data != null ? this.extractEddRawData(data) : null;
		}

		break;

	case "08":
		result.data = data != null ? this.extractIbcData(data) : null;
		break;

	default:
		result.data = data != null ? this.extractPacketData(data) : null;
		break;
	}

	result.crc = this.hexToBinaryString(crc, 16);
	//result.parentId = parent != null ? this.hexToBinaryString(parent, 16) : null;
	result.parentSerial =
		parent != null ? this.hexToBinaryString(parent, 16) : null;
	result.parentType = parentType != null ? parentType.toString(2) : null;
	result.data2 = data2 != null ? this.hexToBinaryString(data2, 16) : null;

	// special case: for the IB651 ordering, we can just slot this in here:
	if ((command == "02" || command == "04" || command == "05") && pos != null) {
		result.windowId = pos.toString();
	}

	result.serial = serial != null ? this.hexToBinaryString(serial, 16) : null;

	return result;
};

PacketUtils.prototype.extractPacketData = function(data) {
	// data should be 4 hex chars, ie: 16 bits

	// Prefix - 8 bits
	let prefix = data.substr(2, 2); // get first 2 hex chars
	let binPrefix = this.hexToBinaryString(prefix, 8); // convert hex to binary and pad
	let deviceType = binPrefix.substr(0, 3); // first 3 bits of the binary prefix is the device type
	let deviceId = binPrefix.substr(3); // last 5 bits of the binary prefix is the device id

	//Raw - 8 bits
	let raw = data.substr(0, 2); // raw data is the last 2 hex chars
	let binRaw = this.hexToBinaryString(raw, 8); // convert hex to binary and pad
	let binRawArr = binRaw.split("");

	return {
		deviceType: deviceType,
		deviceId: deviceId,
		raw: binRawArr
	};
};

PacketUtils.prototype.extractIbcData = function(data) {
	// data should be 4 hex chars, ie: 16 bits

	//Prefix - 8 bits
	let prefix = data.substr(0, 2); // get first 2 hex chars
	let binPrefix = this.hexToBinaryString(prefix, 8); // convert hex to binary and pad
	let deviceType = binPrefix.substr(0, 3); // first 3 bits of the binary prefix is the device type
	let deviceId = binPrefix.substr(3); // last 5 bits of the binary prefix is the device id

	//Raw - 8 bits
	let raw = data.substr(2, 2); // raw data is the last 2 hex chars
	let binRaw = this.hexToBinaryString(raw, 8); // convert hex to binary and pad
	let binRawArr = binRaw.split("");

	return {
		deviceType: deviceType,
		deviceId: deviceId,
		raw: binRawArr
	};
};

PacketUtils.prototype.extractRawData = function(
	commandConstant,
	bytePos,
	parsedPacket,
	result
) {
	let bitTemplate = null;

	switch (bytePos) {
	case 0:
		bitTemplate = commandConstant.data.first_byte.bits;
		break;
		//case 1:
	default:
		bitTemplate = commandConstant.data.remaining_bytes.bits;
	}

	this.populateRawData(bitTemplate, parsedPacket, result);
};

PacketUtils.prototype.populateRawData = function(bits, parsedPacket, result) {
	for (let key in bits) {
		if (bits.hasOwnProperty(key)) {
			for (let prop in result) {
				if (result.hasOwnProperty(prop)) {
					let currentBit = bits[prop];
					if (currentBit != null)
						result[prop] = parseInt(parsedPacket.data.raw[currentBit.index]);
				}
			}
		}
	}
};

PacketUtils.prototype.reverseSerialBytes = function(serialOriginal) {
	const temp = serialOriginal % 256;
	let serialCorrected = null;

	if (temp == 0) {
		serialCorrected = serialOriginal / 256;
	} else {
		serialCorrected = serialOriginal - temp;
		serialCorrected = serialCorrected / 256;
		serialCorrected = serialCorrected + 256 * temp;
	}
	return serialCorrected;
};

PacketUtils.prototype.createPacketResultObject = function() {
	return {
		complete: null,
		start: null,
		length: null,
		command: null,
		serial: null,
		data: null,
		crc: null,
		parentId: null,
		parentType: null,
		parentSerial: null,
		windowId: null,
		data2: null
	};
};

PacketUtils.prototype.createNodeResultObj = function() {
	return {
		serial: null,
		type_id: null,
		key_switch_status: null,
		communication_status: 1,
		temperature: null,
		blast_armed: null, //ready State for AB-1
		fire_button: null,
		isolation_relay: null,
		shaft_fault: null,
		cable_fault: null,
		earth_leakage: null,
		detonator_status: null,
		partial_blast_lfs: null, //det Error for AB-1
		full_blast_lfs: null,
		booster_fired_lfs: null,
		missing_pulse_detected_lfs: null,
		AC_supply_voltage_lfs: null,
		DC_supply_voltage: null,
		DC_supply_voltage_status: null,
		mains: null,
		low_bat: null,
		too_low_bat: null,
		delay: null,
		program: null,
		calibration: null,
		det_fired: null,
		tagged: null,
		energy_storing: null,
		bridge_wire: null,
		parent_id: null,
		parent_type: null,
		parent_serial: null,
		tree_parent_id: null,
		window_id: null,
		crc: null,
		x: 0,
		y: 0
	};
};

PacketUtils.prototype.checkForNoDuplicate = function(
	existingList,
	currentData
) {
	let noDuplicate = 1;
	existingList.forEach(function(item, pos) {
		if (item.serial == currentData.serial && pos > 0) {
			//check if there is a repetition of serial numbers but ignore the parent
			noDuplicate = 0;
		}
	});
	return noDuplicate;
};

/*
 OUTGOING PACKETS
 */

PacketUtils.prototype.buildOutgoingPacket = function($happn, command, serial) {
	const { info } = $happn.log;
	info(`packet utils - incoming command ${command}  serial ${serial}`);

	let start = this.binaryToHexString((0b1010101010101010).toString(2), 4); // start is always AAAA
	let cmd = this.binaryToHexString(command.toString(2), 2);
	let srl = this.pad(parseInt(serial).toString(16), 4);

	let fragment = `${start}${cmd}${srl}`;
	let crc = this.pad(this.generateCRC(fragment).toString(16), 4);

	info("pre-mapped outgoing message: ", fragment + crc);

	// split into array, map each item to decimal, then return
	return (fragment + crc).match(/.{1,2}/g).map(x => parseInt(x, 16));
};

PacketUtils.prototype.extractEddData = function(data) {
	let extractedWindow = this.hexToBinaryString(data.substr(0, 2), 8);
	let extractedEddData = data.substr(2, 2);
	let extractedDelay = data.substr(4, 4);

	return {
		window: extractedWindow,
		eddData: extractedEddData,
		delay: extractedDelay
	};
};

PacketUtils.prototype.extractEddRawData = function(data) {
	// Raw - 8 bits
	let extractedRaw = this.hexToBinaryString(data, 8); // raw data is the last 2 hex chars

	return {
		deviceType: null,
		deviceId: null,
		raw: extractedRaw
	};
};

PacketUtils.prototype.extractEddWindow = function(data) {
	let extractedIp = data.substr(0, 8); //first 8 hex charactes are the ip
	let extractedWindow = this.hexToBinaryString(data.substr(8, 2), 8);

	return {
		//last 2 hex characters are the window
		ip: extractedIp,
		window: extractedWindow
	};
};

PacketUtils.prototype.extractCbbData = function(data) {
	let extractedWindow = this.hexToBinaryString(data.substr(0, 2), 8);
	let extractedCrc = data.substr(2, 2);
	let extractedledData = this.hexToBinaryString(data.substr(4, 1), 8);
	let extraCbbData = data.substr(5, 3);

	return {
		window: extractedWindow,
		crc: extractedCrc,
		ledData: extractedledData,
		cbbData: extraCbbData
	};
};

PacketUtils.prototype.extractCbbRawData = function(data) {
	let extractedRaw = this.hexToBinaryString(data, 16);
	return {
		deviceType: null,
		deviceId: null,
		raw: extractedRaw
	};
};

module.exports = PacketUtils;
