const PacketValidation = function() {};

PacketValidation.prototype.validatePacket = function(packetObject, chunk) {
	const { packet } = packetObject;
	const nonDataBytes = 16;

	const packetSerial = parseInt(packet.substr(8, 4), 16);
	const packetLength = parseInt(packet.substr(4, 2), 16) * 2 - nonDataBytes;
	const chunkSize = new RegExp(`.{1,${chunk}}`, "g");

	const dataPackets = packet.substr(12, packetLength).match(chunkSize);

	console.log("DATAPACKETS", dataPackets);
	if (dataPackets) {
		const lastPacket = dataPackets[dataPackets.length - 1];
		if (lastPacket.length !== chunk) {
			return null;
		}
	}

	return {
		packetSerial: packetSerial,
		dataPackets: !dataPackets ? [] : dataPackets
	};
};
module.exports = PacketValidation;
