/**
 * Created by grant on 2016/08/23.
 */

function ParserFactory() {
	const Constants = require("../constants/command_constants");
	this.__constants = new Constants();
}

ParserFactory.prototype.getParser = function($happn, command) {
	return new Promise((resolve, reject) => {
		const DataParser = require("./data_parser");
		const SerialListParser = require("./serial_list_parser");
		const DataListParser = require("./data_list_parser");

		try {
			let commandConstant = this.__constants.ibcToPiCommands[
				parseInt(command, 16)
			];
			let parser = null;

			switch (commandConstant.data.data_type) {
			case "serial_list":
				parser = new SerialListParser(commandConstant);
				break;
			case "data_list":
				parser = new DataListParser(commandConstant);
				break;
			default:
				parser = new DataParser(commandConstant);
			}
			resolve(parser);
		} catch (err) {
			reject(err);
		}
	});
};

module.exports = ParserFactory;
