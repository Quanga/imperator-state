const CRC = require("../utils/crc");

class PacketUtils {
	constructor() {
		this.constants = require("../constants/packetTemplates").packetConstants;
	}

	buildOutgoingPacket($happn, command, serial) {
		const { log } = $happn;

		const cmd = command.toString(16).padStart(2, "0");
		const srl = parseInt(serial, 10)
			.toString(16)
			.padStart(4, "0");

		const fragment = `${this.constants.headerDelimiter}${cmd}${srl}`;
		const crc = CRC.generateCRC(fragment)
			.toString(16)
			.padStart(4, "0");

		const packet = fragment.concat(crc);

		log.info("pre-mapped outgoing message: ", packet);

		return packet.match(/.{1,2}/g).map(x => parseInt(x, 16));
	}
}

module.exports = PacketUtils;
