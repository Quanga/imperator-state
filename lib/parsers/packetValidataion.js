const PacketValidation = function() {};

PacketValidation.prototype.validatePacket = function(packetObject, chunk) {
	const { packet, createdAt } = packetObject;
	const nonDataBytes = 16;

	const packetSerial = parseInt(packet.substr(8, 4), 16);
	const packetLength = parseInt(packet.substr(4, 2), 16) * 2 - nonDataBytes;
	const chunkSize = new RegExp(`.{1,${chunk}}`, "g");

	const dataPackets = packet.substr(12, packetLength).match(chunkSize);
	const command = parseInt(packet.substr(6, 2), 16);

	if (!dataPackets || dataPackets.length === 0) return null;
	if (dataPackets) {
		const lastPacket = dataPackets[dataPackets.length - 1];
		if (lastPacket.length !== chunk) {
			return null;
		}
	}

	return { createdAt, packetSerial, command, dataPackets };
};
module.exports = PacketValidation;
