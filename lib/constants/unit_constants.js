class Unit {
	constructor(parsedPacket) {
		this.serial = parsedPacket.serial;
		this.type_id = parsedPacket.type_id;
	}
}

module.exports = Unit;
