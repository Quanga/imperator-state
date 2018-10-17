/**
 * Created by grant on 2016/08/23.
 */

function ParserFactory() {
	const Constants = require("../constants/command_constants");
	this.__constants = new Constants();
}

ParserFactory.prototype.getParser = function($happn, command) {
	const { error } = $happn.log;
	const DataParser = require("./data_parser");
	const SerialListParser = require("./serial_list_parser");
	const DataListParser = require("./data_list_parser");
	const UidListParser = require("./uid_list_parser");
	const UidDataListParser = require("./uid_data_list_parser");

	const getParserAsync = async () => {
		try {
			let parser = null;
			let commandConstant = await this.__constants.ibcToPiCommands[
				parseInt(command, 16)
			];

			switch (commandConstant.data.data_type) {
			case "serial_list":
				parser = new SerialListParser(commandConstant);
				break;

			case "data_list":
				parser = new DataListParser(commandConstant);
				break;

			case "uid_list":
				parser = new UidListParser(commandConstant);
				break;

			case "uid_data_list":
				parser = new UidDataListParser(commandConstant);
				break;

			default:
				parser = new DataParser(commandConstant);
			}

			return parser;
		} catch (err) {
			error("Get Parser Error ", command, err);
		}
	};
	return getParserAsync();
};

module.exports = ParserFactory;
