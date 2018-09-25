/**
 * Created by grant on 2016/08/06.
 */

function PacketRepository() {
}

PacketRepository.prototype.initialise = function ($happn, callback) {
	var DbConnectionService = require('../services/db_connection_service');

	var config = $happn.config;

	this.__dbConnectionService = new DbConnectionService();
	this.__dbConnectionService.initialise($happn, config, callback);
};

PacketRepository.prototype.insertPacketArr = function ($happn, insertData, callback) {

	var self = this;

	self.__getConnection($happn, function (err, connection) {

		if (err)
			return callback(err);

		connection.query('INSERT INTO incoming_packets SET ?', insertData, function (err, result) {

			//$happn.log.info('inserting into incoming_packets table...');

			if (err) {
				$happn.log.error('insertPacket error 1', err);
				connection.release();
				return callback(err);
			}
			else {
				//$happn.log.info('record inserted | id: ' + result.insertId);
				connection.release();
				callback(null, result.insertId);
			}
		}
		);
	});
};

PacketRepository.prototype.__getConnection = function ($happn, callback) {

	var self = this;

	self.__dbConnectionService.getConnection($happn, function (err, connection) {
		if (err) {
			$happn.log.error('get connection error: ' + err);
			return callback(err);
		}

		//$happn.log.info('connection returned...');
		callback(null, connection);
	});

};


module.exports = PacketRepository;
