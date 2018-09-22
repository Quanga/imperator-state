/**
 * Created by grant on 2016/08/23.
 */

function ParserFactory() {
    const Constants = require('../constants/command_constants');
    this.__constants = new Constants();
}

ParserFactory.prototype.getParser = function ($happn, command) {
    return new Promise((resolve, reject) => {
        try {
            let commandConstant = this.__constants.ibcToPiCommands[parseInt(command, 16)];
            let parser = null;

            switch (commandConstant.data.data_type) {
                case 'serial_list':
                    const SerialListParser = require('./serial_list_parser');
                    parser = new SerialListParser(commandConstant);
                    break;
                case 'data_list':
                    const DataListParser = require('./data_list_parser');
                    parser = new DataListParser(commandConstant);
                    break;
                case 'uid_list':
                    const UidListParser = require('./uid_list_parser');
                    parser = new UidListParser(commandConstant);
                    break;
                case 'uid_data_list':
                    const UidDataListParser = require('./uid_data_list_parser');
                    parser = new UidDataListParser(commandConstant);
                    break;
                default:
                    const DataParser = require('./data_parser');
                    parser = new DataParser(commandConstant);
            }
            resolve(parser);
        } catch (err) {
            reject(err);
        }
    });
};

module.exports = ParserFactory;