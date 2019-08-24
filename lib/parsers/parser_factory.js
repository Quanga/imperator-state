const DeviceDataParser = require("./deviceDataParser");
const DeviceListParser = require("./deviceListParser");
const CfcDataParser = require("./cfcDataParser");

function ParserFactory() {}

ParserFactory.prototype.getParser = function($happn, packetTemplate) {
	return (async () => {
		switch (packetTemplate.parser) {
		case "deviceList":
			return new DeviceListParser(packetTemplate);
		case "deviceData":
			return new DeviceDataParser(packetTemplate);
		case "cfcDataParser":
			return new CfcDataParser(packetTemplate);
		default:
			throw new Error("No Parser found");
		}
	})();
};

module.exports = ParserFactory;
