/**
 * Created by grant on 2016/06/22.
 */

function PacketService() {}

PacketService.prototype.parseBinaryMessage = function ($happn, data) {
	const PacketUtils = require('../utils/packet_utils');

	return new Promise((resolve, reject) => {
		try {
			// result is a Buffer - get a hex string
			let message = data.toString('hex');
			$happn.log.info('checking CRC in message: ', message);

			let utils = new PacketUtils();

			// extract the last 4 characters (the crc)
			let checkCrc = message.substr(message.length - 4).toLowerCase();
			let checkStr = message.substr(0, message.length - 4);
			let genCrc = (utils.generateCRC(checkStr)).toString(16).toLowerCase();
			let padCrc = utils.pad(genCrc, 4);

			//$happn.log.info('calculated CRC: ', genCrc);

			if (padCrc == checkCrc)
				resolve(message);
			else
				reject(':: Invalid CRC | Check string: ' + checkStr + '; Check CRC: ' + checkCrc + '; Generated CRC: ' + padCrc);
		} catch (err) {
			$happn.log.error('parseBinaryMessage error', err);
			reject(err);
		}
	});

};

PacketService.prototype.extractData = function ($happn, message) {
	const PacketUtils = require('../utils/packet_utils');
	const utils = new PacketUtils();

	var splitPacket = utils.splitPacket(message);
	var command = splitPacket.command;

	return new Promise((resolve, reject) => {
		// use a factory to get the right parser...
		//$happn.log.info('Getting Parser for command -', command);
		return $happn.exchange.parserFactory.getParser(command)
			.then((parser) => {
				return parser.parse($happn, splitPacket, (err, result) => {
					if (err)
						reject(err);
					else
						resolve(result);
				});
			})
			.catch(function (err) {
				$happn.log.error('extractData error', err);
				reject(err);
			});
	});
};

PacketService.prototype.buildNodeData = function ($happn, parsedPacketArr) {
	var command = parseInt(parsedPacketArr[0].command, 2);

	return new Promise((resolve, reject) => {
		// use a factory to get the right parser...
		return $happn.exchange.parserFactory.getParser(command)
			.then((parser) => {
				parser.buildNodeData($happn, parsedPacketArr, function (err, result) {
					if (err) {
						$happn.log.error('buildNodeData error 2', err);
						reject(err);
					} else
						resolve(null, result);
				});
			})
			.catch(function (err) {
				$happn.log.error('buildNodeData error', err);
				reject(err);
			});
	});
};

PacketService.prototype.buildOutgoingPacket = function ($happn, command, serial) {
	const PacketUtils = require('../utils/packet_utils');
	const utils = new PacketUtils();

	return new Promise((resolve, reject) => {
		try {
			let result = utils.buildOutgoingPacket($happn, command, serial);
			resolve(result);
		} catch (err) {
			$happn.log.error('buildOutgoingPacket error', err);
			reject(err);
		}
	});
};

module.exports = PacketService;