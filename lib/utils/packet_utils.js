/**
 * Created by grant on 2016/06/22.
 */

const PacketUtils = function() {
	// const Constants = require("../constants/command_constants");
	// this.__constants = new Constants();
};
//exports.PacketUtils = PacketUtils;

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
	const commandL = 2;
	const serialL = 4;

	// each 2 hex chars = 1 byte (ie: 8 bits)
	let len =
		startFieldLen +
		lengthFieldLen +
		commandL +
		serialL +
		data.length +
		crcFieldLen;

	let byteLen = len / 2;

	// return the hex representation of the length
	return this.pad(byteLen.toString(16), 2);
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

// PacketUtils.prototype.createPacketResult = function(payload) {
// 	let result;
// 	// result.start = this.hexToBinaryString(payload.start, 16);
// 	// result.length = this.hexToBinaryString(payload.length, 8);
// 	// result.command = this.hexToBinaryString(payload.command, 8);

// 	switch (payload.command) {
// 	case "05":
// 		if (payload.typeId == 3) {
// 			result.data =
// 					payload.data != null ? this.extractCbbRawData(payload.data) : null;
// 			result.led_state =
// 					payload.ledData != null ? payload.ledData.toString() : null;
// 		} else {
// 			result.data =
// 					payload.data != null ? this.extractEddRawData(payload.data) : null;
// 		}

// 		break;

// 	case "08":
// 		result.data =
// 				payload.data != null ? this.extractControlUnitData(payload.data) : null;
// 		break;

// 	default:
// 		result.data =
// 				payload.data != null ? this.extractPacketData(payload.data) : null;
// 		break;
// 	}

// 	// result.crc = this.hexToBinaryString(payload.crc, 16);
// 	// result.parentSerial =
// 	// 	payload.parent != null ? this.hexToBinaryString(payload.parent, 16) : null;
// 	// result.parentType =
// 	// 	payload.parentType != null ? payload.parentType.toString(2) : null;

// 	result.data2 =
// 		payload.data2 != null ? this.hexToBinaryString(payload.data2, 16) : null;

// 	// special case: for the IB651 ordering, we can just slot this in here:
// 	if (
// 		(payload.command == "02" ||
// 			payload.command == "04" ||
// 			payload.command == "05") &&
// 		payload.position != null
// 	) {
// 		result.windowId = payload.position.toString();
// 	}

// 	// result.serial =
// 	// 	payload.serial != null ? this.hexToBinaryString(payload.serial, 16) : null;

// 	return result;
// };

/***
 * @summary Extract the raw data from the packet accoring to the bittemplate assigned
 * @param bitTemplate - the bit template for the packet
 * @param parsedPacket - the parsed packet
 * @param result - the result is returned
 */
PacketUtils.prototype.extractRawData = function(
	bitTemplate,
	parsedPacket,
	result
) {
	for (let key in bitTemplate) {
		if (bitTemplate.hasOwnProperty(key)) {
			for (let prop in result) {
				if (result.hasOwnProperty(prop)) {
					let currentBit = bitTemplate[prop];

					if (currentBit != null) {
						result[prop] = parsedPacket.data.raw[currentBit.index];
					}
				}
			}
		}
	}
};

/***
 * @summary Reverse the serial bytes of a binary
 * @param serialOriginal - the bit template for the packet
 *
 * @param serialCorrected - the result is returned
 */
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
 Control Unit Extracting
 */
PacketUtils.prototype.extractControlUnitData = function(data) {
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
	var res = binRawArr.map(v => parseInt(v, 2));

	return {
		deviceType: deviceType,
		deviceId: deviceId,
		raw: res
	};
};

/*
 IBS General  Parsing
 */
PacketUtils.prototype.extractPacketData = function(data) {
	console.log("EXTRACT PACKET  ----", data);
	let self = this;
	// data should be 4 hex chars, ie: 16 bits
	// Prefix - 8 bits
	let prefix = data.substr(2, 2); // get last 2 hex chars
	let binPrefix = self.hexToBinaryString(prefix, 8); // convert hex to binary and pad
	let deviceType = binPrefix.substr(0, 3); // first 3 bits of the binary prefix is the device type
	let deviceId = binPrefix.substr(3); // last 5 bits of the binary prefix is the device id

	//Raw - 8 bits
	let raw = data.substr(0, 2); // raw data is the first 2 hex chars
	let binRaw = self.hexToBinaryString(raw, 8); // convert hex to binary and pad
	let binRawArr = binRaw.split("");
	var res = binRawArr.map(v => parseInt(v, 2));

	console.log("EXTRACT PACKET  ----", {
		deviceType: deviceType,
		deviceId: deviceId,
		raw: res
	});

	return {
		deviceType: parseInt(deviceType, 2),
		deviceId: deviceId,
		raw: res
	};
};

/*
 CBB Parsing
 */
PacketUtils.prototype.extractCbbRawData = function(data) {
	let extractedRaw = this.hexToBinaryString(data, 16);
	let binRawArr = extractedRaw.split("");
	var res = binRawArr.map(v => parseInt(v, 8));
	return {
		deviceType: null,
		deviceId: null,
		raw: res
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

/*
 EDD Parsing
 */
PacketUtils.prototype.extractEddRawData = function(data) {
	// Raw - 8 bits
	let extractedRaw = this.hexToBinaryString(data, 8); // raw data is the last 2 hex chars
	let binRawArr = extractedRaw.split("");
	var res = binRawArr.map(v => parseInt(v, 2));
	return {
		deviceType: null,
		deviceId: null,
		raw: res
	};
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

PacketUtils.prototype.extractEddWindow = function(data) {
	let extractedIp = data.substr(0, 8); //first 8 hex charactes are the ip
	let extractedWindow = this.hexToBinaryString(data.substr(8, 2), 8);

	return {
		//last 2 hex characters are the window
		ip: extractedIp,
		window: extractedWindow
	};
};

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

module.exports = PacketUtils;
