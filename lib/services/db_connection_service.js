/**
 * Created by grant on 2017/01/06.
 */

function DbConnectionService() {
    this.__pool = null;
}

DbConnectionService.prototype.initialise = function ($happn, config, callback) {

    var mysql = require('mysql');

    try {
        $happn.log.info('creating connection pool...');

        this.__pool = mysql.createPool({
            host: config.mySqlHost,
            user: config.mySqlUser,
            password: config.mySqlPassword,
            database: config.mySqlDb,
            connectionLimit: config.mySqlConnectionLimit,
            acquireTimeout: 60000,
            queueLimit: 0,
            timeout: 60000
        });

        callback();
    } catch (err) {
        $happn.log.error('connection pool error: ' + err);
        return callback(err);
    }
};

DbConnectionService.prototype.getConnection = function ($happn, callback) {
    var self = this;

    self.__pool.getConnection(function (err, connection) {
        if (err)
            return callback(err);

        //$happn.log.info('returning connection from pool...');
        return callback(null, connection);
    });
};

module.exports = DbConnectionService;

