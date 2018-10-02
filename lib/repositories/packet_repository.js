/**
 * Created by grant on 2016/08/06.
 */

function PacketRepository() {}

PacketRepository.prototype.initialise = function($happn) {
	const self = this;
	var DbConnectionService = require("../services/db_connection_service");
	$happn.log.info("Packet Repository Initialize.................");

	var config = $happn.config;
	return new Promise((resolve, reject) => {
		try {
			self.__dbConnectionService = new DbConnectionService();
			self.__dbConnectionService.initialise($happn, config);
			$happn.log.info("Packet Repository Initialize.................PASS");

			resolve();
		} catch (err) {
			$happn.log.error(
				"Packet Repository Initialize.................FAIL",
				err
			);

			reject(err);
		}
	});
};

PacketRepository.prototype.insertPacketArr = function($happn, insertData) {
	var self = this;

	async function insertArray() {
		let connection;
		try {
			let connection = await self.__getConnection($happn);
			let result = await connection.query(
				"INSERT INTO incoming_packets SET ?",
				insertData
			);
			$happn.log.info("record inserted | id: " + result.insertId);
			connection.release();
			//return result.insertId;
		} catch (err) {
			$happn.log.error("insertPacket error 1", err);
			connection.release();
		}
	}
	return insertArray();
};

PacketRepository.prototype.__getConnection = function($happn) {
	var self = this;

	return new Promise((resolve, reject) => {
		self.__dbConnectionService
			.getConnection($happn)
			.then(connection => {
				resolve(connection);
			})
			.catch(err => {
				$happn.log.error("get connection error: " + err);
				reject(err);
			});
	});
};

module.exports = PacketRepository;
