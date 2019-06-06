class PacketUtils {
	constructor() {}

	binaryToHexString(binString, padLen) {
		const result = parseInt(binString, 2).toString(16);
		return padLen ? this.pad(result, padLen) : result;
	}

	hexToBinaryString(hexString, padLen) {
		const result = parseInt(hexString, 16).toString(2);
		return padLen ? this.pad(result, padLen) : result;
	}

	calculatePacketLength(command, serial, data) {
		const pattern = {
			start: 4,
			length: 2,
			crc: 4,
			cmd: 2,
			srl: 4
		};

		// each 2 hex chars = 1 byte (ie: 8 bits)
		let len =
			pattern.start +
			pattern.length +
			pattern.cmd +
			pattern.srl +
			data.length +
			pattern.crc;
		let byteLen = len / 2;

		// return the hex representation of the length
		return this.pad(byteLen.toString(16), 2);
	}

	pad(str, len) {
		let start = "";
		while (start.length + str.length < len) {
			start += "0";
		}
		return start + str;
	}

	reverseSerialBytes(serialOriginal) {
		let temp = serialOriginal % 256;
		let serialCorrected = null;

		if (temp === 0) {
			serialCorrected = serialOriginal / 256;
		} else {
			serialCorrected = serialOriginal - temp;
			serialCorrected = serialCorrected / 256;
			serialCorrected = serialCorrected + 256 * temp;
		}
		return serialCorrected;
	}

	checkForNoDuplicate(existingList, currentData) {
		let noDuplicate = 1;
		existingList.forEach((item, pos) => {
			if (item.serial === currentData.serial && pos > 0) {
				//check if there is a repetition of serial numbers but ignore the parent
				noDuplicate = 0;
			}
		});
		return noDuplicate;
	}

	generateCRC(data) {
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
	}

	buildOutgoingPacket($happn, command, serial) {
		const { info } = $happn.log;

		let start = this.binaryToHexString((0b1010101010101010).toString(2), 4); // start is always AAAA
		let cmd = this.binaryToHexString(command.toString(2), 2);
		let srl = this.pad(parseInt(serial).toString(16), 4);

		let fragment = `${start}${cmd}${srl}`;
		let crc = this.pad(this.generateCRC(fragment).toString(16), 4);

		info("pre-mapped outgoing message: ", fragment + crc);

		// split into array, map each item to decimal, then return
		return (fragment + crc).match(/.{1,2}/g).map(x => parseInt(x, 16));
	}
}

module.exports = PacketUtils;
