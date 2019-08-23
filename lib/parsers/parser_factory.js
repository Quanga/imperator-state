const DeviceDataParser = require("./deviceDataParser");
const DeviceListParser = require("./deviceListParser");

function ParserFactory() {}

ParserFactory.prototype.getParser = function($happn, packetTemplate) {
	const { log } = $happn;

	return (async () => {
		try {
			switch (packetTemplate.parser) {
			case "deviceList":
				return new DeviceListParser(packetTemplate);
			case "deviceData":
				return new DeviceDataParser(packetTemplate);
			default:
				throw new Error("No Parser found");
			}
		} catch (err) {
			log.error("Get Parser Error ", err);
			return Promise.reject(err);
		}
	})();
};

module.exports = ParserFactory;
