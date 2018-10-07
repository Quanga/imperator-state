/**
 * Created by grant on 2016/08/23.
 */

function ParserFactory() {
	const Constants = require("../constants/command_constants");
	this.__constants = new Constants();
}

ParserFactory.prototype.getParser = function($happn, command) {
	var self = this;

	let getParserAsync = async () => {
		const DataParser = require("./data_parser");
		const SerialListParser = require("./serial_list_parser");
		const DataListParser = require("./data_list_parser");
		let parser = null;

		try {
			let commandConstant;
			commandConstant = await self.__constants.ibcToPiCommands[
				parseInt(command, 16)
			];

			switch (commandConstant.data.data_type) {
			case "serial_list":
				parser = new SerialListParser(commandConstant);
				break;
			case "data_list":
				parser = new DataListParser(commandConstant);
				break;
			default:
				parser = new DataParser(commandConstant);
				break;
			}

			return parser;
		} catch (err) {
			$happn.log.error("Get Parser Error ", command, err);
		}
	};
	return getParserAsync();
};

module.exports = ParserFactory;
