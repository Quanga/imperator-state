function ParserFactory() {}

ParserFactory.prototype.getParser = function($happn, packet) {
	const { error } = $happn.log;
	const DeviceDataParser = require("./deviceDataParser");
	const DeviceListParser = require("./deviceListParser");

	const getParserAsync = async () => {
		try {
			let parser = null;
			//lookup command in the commConst

			let parserType = packet.template.parser;

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
			error("Get Parser Error ", packet, err);
		}
	};
	return getParserAsync();
};

module.exports = ParserFactory;
