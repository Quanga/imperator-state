function ParserFactory() {}

ParserFactory.prototype.getParser = function($happn, packet) {
	const { error: logError } = $happn.log;
	const DeviceDataParser = require("./deviceDataParser");
	const DeviceListParser = require("./deviceListParser");

	const getParserAsync = async () => {
		try {
			let parserType = packet.template.parser;
			let parser;

			switch (parserType) {
			case "deviceList":
				parser = new DeviceListParser();
				break;

			case "deviceData":
				parser = new DeviceDataParser();
				break;
			}

			return parser;
		} catch (err) {
			logError("Get Parser Error ", packet, err);
		}
	};

	return getParserAsync();
};

module.exports = ParserFactory;
