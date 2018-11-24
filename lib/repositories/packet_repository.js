function PacketRepository() {}

PacketRepository.prototype.initialise = function($happn) {
	const { info: logInfo, error: logError } = $happn.log;
	logInfo("Packet Repository Initialize.................");

	let initAsync = async () => {
		try {
			logInfo("Packet Repository Initialize.................PASS");
		} catch (err) {
			logError("Packet Repository Initialize.................FAIL", err);
			return Promise.reject(err);
		}
	};
	return initAsync();
};

PacketRepository.prototype.insertPacketArr = function($happn, insertData) {
	const { error: logError } = $happn.log;
	let insertArray = async () => {
		let connection;

		try {
			let connection = await this.__getConnection($happn);
			let result = await connection.query(
				"INSERT INTO incoming_packets SET ?",
				insertData
			);
			//$happn.log.info("record inserted | id: " + result.insertId);
			connection.release();
			return result.insertId;
		} catch (err) {
			logError("insertPacket error 1", err);
			connection.release();
			return Promise.reject(err);
		}
	};

	return insertArray();
};

PacketRepository.prototype.__getConnection = function($happn) {
	const { error: logError } = $happn.log;
	const { dbConnectionService } = $happn.exchange;

	let connectAsync = async () => {
		try {
			return await dbConnectionService.getConnection();
		} catch (err) {
			logError("get connection error: " + err);
			return Promise.reject(err);
		}
	};

	return connectAsync();
};

module.exports = PacketRepository;
