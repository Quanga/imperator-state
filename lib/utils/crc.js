module.exports = {
	generateCRC: data => {
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
};
