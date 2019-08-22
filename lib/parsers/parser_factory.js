const DeviceDataParser = require("./deviceDataParser");
const DeviceListParser = require("./deviceListParser");

function ParserFactory() {}

ParserFactory.prototype.getParser = function($happn, packetTemplate) {
	const { error: logError } = $happn.log;

	const getParserAsync = async () => {
		try {
			switch (packetTemplate.parser) {
			case "deviceList":
				return new DeviceListParser(packetTemplate);
			case "deviceData":
				return new DeviceDataParser(packetTemplate);
			default:
				return false;
				//throw new Error("No Parser found");
			}
		} catch (err) {
			logError("Get Parser Error ", err);
			return Promise.reject(err);
		}
	};

	return getParserAsync();
};

module.exports = ParserFactory;
