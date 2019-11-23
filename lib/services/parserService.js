/* eslint-disable no-unused-vars */
const PacketUtils = require("../utils/packet_utils");

const fields = require("../configs/fields/fieldConstants");
const modes = require("../configs/modes/modes");

const Parser = require("../parsers/parser");
const UnitBuilder = require("../builders/unitBuilder");
const UnitModelFactory = require("../models/units/unitModelFactory");

function ParserService() {
	this._utils = new PacketUtils();
}

/***
 * @summary Extract data from a message return converted message once the
 * CRC has qualified
 * Incoming from the QUEUE SERVICE > INCOMING QUEUE
 * returnes a list of units
 * @param $happn
 * @param msgObj - the incoming message
 */
ParserService.prototype.extractData = function($happn, msgObj) {
	const { parserService } = $happn.exchange;
	const { env } = $happn.config;
	const { log } = $happn;

	return (async () => {
		try {
			await parserService.validatePacket(msgObj);

			//parse the data
			const parsedObj = Parser.create()
				.withMode(modes[env.systemMode])
				.withPacket(msgObj)
				.build();

			const builtUnits = await parserService.buildUnits(parsedObj);

			return builtUnits;
		} catch (err) {
			log.error(err);
			//log.warn("extractData error", err.message);
			return null;
		}
	})();
};

ParserService.prototype.buildUnits = function($happn, parsedObj) {
	const { nodered } = $happn.exchange;
	const { log } = $happn;

	return (async () => {
		try {
			let validate = await new Promise((resolve, reject) => {
				nodered.callFlow("validate_parsed", parsedObj, (err, payload) => {
					if (err) return reject(err);

					resolve(payload);
				});
			});

			const unitsObj = await UnitBuilder.create(UnitModelFactory).fromArray(validate);
			return unitsObj;
		} catch (error) {
			log.error(error);
			throw new Error(`Build Units Error: ${error.message}`);
		}
	})();
};

ParserService.prototype.validatePacket = function($happn, msgObj) {
	const { env } = $happn.config;
	const { log } = $happn;

	return (async () => {
		try {
			const { packet } = msgObj;
			const packetType = parseInt(packet.substr(6, 2), 16);

			if (modes[env.systemMode].commands.indexOf(packetType) === -1)
				throw new Error(`Packet command not available on this system ${packet}`);

			return msgObj;
		} catch (error) {
			log.warn("Packet Validation Error: ", error.message);
			throw new Error(error.message);
		}
	})();
};

ParserService.prototype.buildOutgoingPacket = function($happn, cmd, srl) {
	const { log } = $happn;

	return (async () => {
		try {
			let result = this._utils.buildOutgoingPacket($happn, cmd, srl);
			return result;
		} catch (err) {
			log.error("buildOutgoingPacket error", err);
		}
	})();
};

/********************************************************************************
 PACKET DATA SERVICES
 ********************************************************************************/

/***
 * @summary Async function that takes the packet array and
 *  inserts inserts it into the packet database
 * @param $happn
 * @param packetArr - parsed node data that has been received from the IBC
 */
ParserService.prototype.routePacket = function($happn, msgObj) {
	const { packetRepository } = $happn.exchange;
	const { emit, log } = $happn;
	const { createdAt } = fields;

	const { message, passed, route, processed } = msgObj;

	return (async () => {
		try {
			const repoRoute = passed ? `${route}/queue` : `${route}/failed`;
			let path = `${repoRoute}/${msgObj[createdAt]}`;

			if (processed) {
				const deleted = await packetRepository.delete(path);
				path = `${route}/processed/${msgObj[createdAt]}`;
			}

			const insertedPacket = await packetRepository.set(path, {
				data: {
					[fields.createdAt]: msgObj[createdAt],
					message: message,
					passed: passed,
					route: route,
					processed: processed,
				},
			});

			if (passed && !processed) emit("INCOMING_PACKET", insertedPacket);
		} catch (err) {
			log.error("routing packet error", err);
		}
	})();
};

module.exports = ParserService;
