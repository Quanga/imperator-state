/**
 * @category Models
 * @module models/Extractors
 */

/**
 * @class
 */
class Extractors {
	constructor() {}

	/**
	 * @summary Extract Control Unit Data
	 * @param {*} rawData
	 */
	extractControlUnit(rawData) {
		return {
			data: rawData ? this.convertRaw(rawData, 2, 2, 8, 2) : null,
		};
	}

	/**
	 * @param {*} data
	 * @param {*} from
	 * @param {*} length
	 * @param {*} pad
	 * @param {*} rad
	 */
	convertRaw(data, from, length, pad, rad) {
		let rawData = parseInt(data.substr(from, length), 16)
			.toString(2)
			.padStart(pad, "0");
		let result = rawData.split("");
		let resultArr = result.map(v => parseInt(v, rad));
		return resultArr;
	}

	/**
	 * @param {*} rawData
	 * @param {*} extendWindowId
	 */
	extractCbbRawData(rawData, extendWindowId) {
		let offset = !extendWindowId ? 0 : 2;

		let childCount = rawData ? parseInt(rawData.substr(0, 2 + offset), 16) : 0;

		if (process.env.MODE === "HYDRA") {
			childCount = rawData ? this.reverseSerialBytes(parseInt(rawData.substr(0, 4), 16)) : 0;
		}
		const ledState = rawData ? parseInt(rawData.substr(4 + offset, 1), 16) : null;
		const data = rawData ? this.convertRaw(rawData.substr(5 + offset, 3), 0, 3, 16, 8) : null;

		return {
			childCount: childCount ? childCount : 0,
			ledState: ledState ? ledState : null,
			data: data ? data : null,
		};
	}

	/**
	 * @param {*} rawData
	 * @param {*} extended
	 */
	extractEDDListData(rawData, extended) {
		return {
			serial: parseInt(rawData.substr(0, 8), 16),
			windowId: extended
				? this.reverseSerialBytes(parseInt(rawData.substr(8, 4), 16))
				: parseInt(rawData.substr(8, 2), 16),
		};
	}

	/**
	 * @param {*} rawData
	 * @param {*} extendWindowId
	 */
	extractEddRawData(rawData, extendWindowId) {
		let offset = !extendWindowId ? 0 : 2;

		return {
			windowId: !extendWindowId
				? parseInt(rawData.substr(0, 2), 16)
				: this.reverseSerialBytes(parseInt(rawData.substr(0, 2 + offset), 16)),
			data: this.convertRaw(rawData.substr(2 + offset, 2), 0, 8, 8, 2),
			delay: this.reverseSerialBytes(parseInt(rawData.substr(4 + offset, 4), 16)) || 0,
		};
	}

	/**
	 * @param {*} rawData
	 */
	extractIBS(rawData) {
		return { data: rawData ? this.convertRaw(rawData, 0, 2, 8, 2) : null };
	}

	/**
	 * @param {*} rawData
	 */
	extractCFC(rawData) {
		return {
			qos: Math.floor((parseInt(rawData.substr(0, 2), 16) / 255) * 100),
			data: rawData ? this.convertRaw(rawData, 2, 2, 8, 2) : null,
			qosFiring: parseInt(rawData.substr(6, 2), 16),
			firmware: parseInt(rawData.substr(8, 2), 10),
		};
	}

	// aaaa0c18 0008 0400 0000 09f3
	/**
	 * @param {*} rawData
	 */
	extractWifi(rawData) {
		return {
			lostPackets: parseInt(rawData.substr(0, 4), 16),
			packetSinceLastFiring: parseInt(rawData.substr(0, 4), 16),
		};
	}

	/**
	 * @param {*} serialOriginal
	 */
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
}

module.exports = Extractors;
