/**
 * Created by grant on 2016/08/06.
 */

function NodeRepository() {
}

NodeRepository.prototype.initialise = function ($happn, callback) {

    var DbConnectionService = require('../services/db_connection_service');

    var config = $happn.config;

    this.__dbConnectionService = new DbConnectionService();
    this.__dbConnectionService.initialise($happn, config, callback);
};

NodeRepository.prototype.getNodeData = function ($happn, callback) {

    var self = this;

    self.__getConnection($happn, function (err, connection) {

        if (err)
            return callback(err);

        // get all data
        var query = 'SELECT DISTINCT * FROM nodes';

        connection.query({sql: query}, function (err, results) {
            if (err) {
                $happn.log.error('findNodeTreeData error', err);
                connection.release();
                return callback(err);
            } else {
                connection.release();
                callback(null, results);
            }
        });
    });
};

NodeRepository.prototype.findNodeTreeData = function ($happn, serial, typeId, callback) {

    var self = this;

    self.__getConnection($happn, function (err, connection) {

        if (err)
            return callback(err);

        // get the parent, children and grandchildren (ie: IBC1/ISC1/IB651)
        //var query = 'SELECT DISTINCT * FROM nodes p ' +
        //    'LEFT OUTER JOIN nodes c ON ' +
        //    'p.serial = c.tree_parent_id ' +
        //    'LEFT OUTER JOIN nodes g ON ' +
        //    'c.serial = g.tree_parent_id ' +
        //    'WHERE p.serial = ? ' +
        //    'AND p.type_id = ? ' +
        //    'ORDER BY c.id, g.id ASC';

        var query = 'SELECT DISTINCT * FROM nodes p ' +
            'LEFT OUTER JOIN nodes c ON ' +
            'p.id = c.parent_id ' +
            'LEFT OUTER JOIN nodes g ON ' +
            'c.id = g.parent_id ' +
            'WHERE p.serial = ? ' +
            'AND p.type_id = ? ' +
            'ORDER BY c.id, g.id ASC';

        connection.query({sql: query, nestTables: '.'}, [serial, typeId], function (err, results) {
            if (err) {
                $happn.log.error('findNodeTreeData error', err);
                connection.release();
                return callback(err);
            } else {
                connection.release();
                callback(null, results);
            }
        });
    });


};

NodeRepository.prototype.findNodes = function ($happn, callback) {

    var self = this;

    self.__getConnection($happn, function (err, connection) {

        if (err)
            return callback(err);

        var query = 'SELECT * FROM nodes';

        connection.query({sql: query}, function (err, results) {
            if (err) {
                $happn.log.error('findNodes error', err);
                connection.release();
                return callback(err);
            } else {
                connection.release();
                callback(null, JSON.parse(JSON.stringify(results)));
            }
        });
    });


};

NodeRepository.prototype.getCompleteNodeTreeData = function ($happn, callback) {

    var self = this;

    self.__getConnection($happn, function (err, connection) {

        if (err)
            return callback(err);

        // get the complete tree using the IBC as the root
        var query = 'SELECT DISTINCT * FROM nodes p ' +
            'LEFT OUTER JOIN nodes c ON ' +
            'p.id = c.parent_id ' +
            'LEFT OUTER JOIN nodes g ON ' +
            'c.id = g.parent_id ' +
            'WHERE p.type_id = 0 ' +
            'ORDER BY p.id, c.id, g.id ASC';

        connection.query({sql: query, nestTables: '.'}, function (err, results) {
            if (err) {
                $happn.log.error('getCompleteNodeTree error', err);
                connection.release();
                return callback(err);
            } else {
                connection.release();
                callback(null, results);
            }
        });
    });


};

NodeRepository.prototype.insertLogData = function ($happn, logs, callback) {

    var self = this;

    self.__getConnection($happn, function (err, connection) {

        if (err)
            return callback(err);

        connection.query('INSERT INTO logs SET ?,created=NOW()', logs, function (err, result) {

            //console.log('::: inserting into logs table... ');

            if (err) {
                $happn.log.error('insertNodeData error', err);
                connection.release();
                return callback(err);
            } else {
                //console.log('::: record inserted | id: ' + result.insertId);
                connection.release();
                callback(null, result.insertId);
            }
        });
    });
};

NodeRepository.prototype.getLogData = function ($happn, nodeSerial, callback) {

    var self = this;

    self.__getConnection($happn, function (err, connection) {

        if (err)
            return callback(err);

        var query = 'SELECT * FROM logs ' +
            'WHERE node_serial = ? ' +
            'ORDER BY created DESC ' +
            'LIMIT 1';

        connection.query({sql: query}, [nodeSerial], function (err, results) {

            if (err) {
                $happn.log.error('getLogData error', err);
                connection.release();
                return callback(err);
            } else {
                connection.release();
                callback(null, results);
            }
        });
    });
};

// this requires explicit release of connection by consuming module
NodeRepository.prototype.insertNodeData = function ($happn, parsedPacket, callback) {

    const util = require('util');
    var self = this;

    self.__getConnection($happn, function (err, connection) {

        if (err)
            return callback(err);

        var query = util.format('INSERT INTO nodes SET ' +
            'serial = %s, ' +
            'type_id = %s, ' +
            'key_switch_status = %s,' +
            'communication_status = %s, ' +
            'temperature = %s, ' +
            'blast_armed = %s, ' +
            'fire_button = %s, ' +
            'isolation_relay = %s, ' +
            'shaft_fault = %s, ' +
            'cable_fault = %s,' +
            'earth_leakage = %s, ' +
            'detonator_status =%s,' +
            'partial_blast_lfs = %s, ' +
            'full_blast_lfs = %s,' +
            'booster_fired_lfs = %s, ' +
            'missing_pulse_detected_lfs = %s,' +
            'AC_supply_voltage_lfs = %s, ' +
            'DC_supply_voltage = %s,' +
            'DC_supply_voltage_status = %s, ' +
            'mains = %s,' +
            'low_bat = %s,' +
            'too_low_bat = %s,' +
            'delay = %s,' +
            'program = %s,' +
            'calibration = %s,' +
            'det_fired = %s,' +
            'tagged = %s,' +
            'energy_storing = %s,' +
            'bridge_wire = %s,' +
            'parent_id = %s, ' +
            'window_id = %s, ' +
            'x = %s, ' +
            'y = %s ',
            parsedPacket.serial,
            parsedPacket.type_id,
            parsedPacket.key_switch_status,
            parsedPacket.communication_status,
            parsedPacket.temperature,
            parsedPacket.blast_armed,
            parsedPacket.fire_button,
            parsedPacket.isolation_relay,
            parsedPacket.shaft_fault,
            parsedPacket.cable_fault,
            parsedPacket.earth_leakage,
            parsedPacket.detonator_status,
            parsedPacket.partial_blast_lfs,
            parsedPacket.full_blast_lfs,
            parsedPacket.booster_fired_lfs,
            parsedPacket.missing_pulse_detected_lfs,
            parsedPacket.AC_supply_voltage_lfs,
            parsedPacket.DC_supply_voltage,
            parsedPacket.DC_supply_voltage_status,
            parsedPacket.mains,
            parsedPacket.low_bat,
            parsedPacket.too_low_bat,
            parsedPacket.delay,
            parsedPacket.program,
            parsedPacket.calibration,
            parsedPacket.det_fired,
            parsedPacket.tagged,
            parsedPacket.energy_storing,
            parsedPacket.bridge_wire,
            parsedPacket.parent_id,
            parsedPacket.window_id,
            parsedPacket.x,
            parsedPacket.y);

        connection.query(query, function (err, result) {

            $happn.log.info('inserting into nodes table... ');

            if (err) {
                $happn.log.error('insertNodeData error', err);
                connection.release();
                return callback(err);
            } else {
                //$happn.log.info('record inserted | id: ' + result.insertId);
                connection.release();
                callback(null, result.insertId);
            }
        });
    });
};

// this requires explicit closing of connection by consuming module
NodeRepository.prototype.updateNodeData = function ($happn, nodeItem, callback) {

    var self = this;
    const util = require('util');
    self.__getConnection($happn, function (err, connection) {

        if (err)
            return callback(err);
        var query = util.format('UPDATE nodes SET ' +
            'type_id = %s, ' +
            'key_switch_status = %s,' +
            'communication_status = %s, ' +
            'temperature = %s, ' +
            'blast_armed = %s, ' +
            'fire_button = %s, ' +
            'isolation_relay = %s, ' +
            'shaft_fault = %s, ' +
            'cable_fault = %s,' +
            'earth_leakage = %s, ' +
            'detonator_status =%s,' +
            'partial_blast_lfs = %s, ' +
            'full_blast_lfs = %s,' +
            'booster_fired_lfs = %s, ' +
            'missing_pulse_detected_lfs = %s,' +
            'AC_supply_voltage_lfs = %s, ' +
            'DC_supply_voltage = %s,' +
            'DC_supply_voltage_status = %s, ' +
            'mains = %s,' +
            'low_bat = %s,' +
            'too_low_bat = %s,' +
            'delay = %s,' +
            'program = %s,' +
            'calibration = %s,' +
            'det_fired = %s,' +
            'tagged = %s,' +
            'energy_storing = %s,' +
            'bridge_wire = %s,' +
            'parent_id = %s, ' +
            'tree_parent_id = %s, ' +
            'window_id = %s ' +
            'WHERE id = %s',
            nodeItem.type_id,
            nodeItem.key_switch_status,
            nodeItem.communication_status,
            nodeItem.temperature,
            nodeItem.blast_armed,
            nodeItem.fire_button,
            nodeItem.isolation_relay,
            nodeItem.shaft_fault,
            nodeItem.cable_fault,
            nodeItem.earth_leakage,
            nodeItem.detonator_status,
            nodeItem.partial_blast_lfs,
            nodeItem.full_blast_lfs,
            nodeItem.booster_fired_lfs,
            nodeItem.missing_pulse_detected_lfs,
            nodeItem.AC_supply_voltage_lfs,
            nodeItem.DC_supply_voltage,
            nodeItem.DC_supply_voltage_status,
            nodeItem.mains,
            nodeItem.low_bat,
            nodeItem.too_low_bat,
            nodeItem.delay,
            nodeItem.program,
            nodeItem.calibration,
            nodeItem.det_fired,
            nodeItem.tagged,
            nodeItem.energy_storing,
            nodeItem.bridge_wire,
            nodeItem.parent_id,
            nodeItem.tree_parent_id,
            nodeItem.window_id,
            nodeItem.id);

        connection.query(query, function (err, result) {

            $happn.log.info('updating record on nodes table... ');

            if (err) {
                $happn.log.error('updateNodeData error', err);
                connection.release();
                return callback(err);

            } else {
                $happn.log.info('record updated...');
                //clear fired flag when type_id is 0, and fire button is pressed
                if ((nodeItem.type_id == 0) && (nodeItem.fire_button == 1)) {
                    $happn.log.info('clearing fire flags...');
                    var fireFlagQuery = util.format('UPDATE nodes SET booster_fired_lfs = 0 WHERE type_id = 2');
                    connection.query(fireFlagQuery, function (err, fireFlagResult) {
                    });
                    var connectedDetLfsQuery = util.format('UPDATE nodes SET detonator_lfs = "Not fired" WHERE type_id=2 AND detonator_status=1');
                    connection.query(connectedDetLfsQuery, function (err, connectedDetLfsResult) {
                    });
                    var notConnectedDetLfsQuery = util.format('UPDATE nodes SET detonator_lfs = "No detonator" WHERE type_id=2 AND detonator_status=0');
                    connection.query(notConnectedDetLfsQuery, function (err, notconnectedDetLfsResult) {
                    });
                }
                connection.release();
                callback(null, result);
            }
        });
    });
};

//NodeRepository.prototype.deleteNode = function ($happn, serial, callback) {
//
//    var self = this;
//    self.__createConnection($happn);
//
//    self.__connection.query('DELETE FROM nodes WHERE serial = ?', serial, function (err, result) {
//
//        $happn.log.info('deleting record from nodes table... ');
//
//        if (err) {
//            $happn.log.error('deleteNodeData error', err);
//            self.closeConnection($happn);
//            callback(err);
//        } else {
//            $happn.log.info('record deleted...');
//            self.closeConnection($happn);
//            callback();
//        }
//    });
//};

NodeRepository.prototype.deleteNodeData = function ($happn, callback) {

    var self = this;

    self.__getConnection($happn, function (err, connection) {

        if (err)
            return callback(err);

        connection.query('DELETE FROM nodes', function (err, result) {

            //$happn.log.info('deleting all records from nodes table... ');

            if (err) {
                $happn.log.error('deleteNodeData error', err);
                connection.release();
                return callback(err);
            } else {
                $happn.log.info('records deleted...');
                connection.release();
                callback();
            }
        });
    });
};

NodeRepository.prototype.getIbcSerials = function ($happn, callback) {
    var self = this;

    self.__getConnection($happn, function (err, connection) {

        if (err)
            return callback(err);

        connection.query('SELECT DISTINCT serial FROM nodes WHERE type_id = 0', function (err, results) {

            if (err) {
                $happn.log.error('getIbcSerials error', err);
                connection.release();
                return callback(err);
            } else {
                connection.release();
                callback(null, results);
            }
        });
    });
};

NodeRepository.prototype.getIscSerials = function ($happn, callback) {
    var self = this;

    self.__getConnection($happn, function (err, connection) {

        if (err)
            return callback(err);

        connection.query('SELECT DISTINCT serial FROM nodes WHERE type_id = 1', function (err, results) {

            if (err) {
                $happn.log.error('getIscSerials error', err);
                connection.release();
                return callback(err);
            } else {
                connection.release();
                callback(null, results);
            }
        });
    });
};

NodeRepository.prototype.__getConnection = function ($happn, callback) {

    var self = this;

    self.__dbConnectionService.getConnection($happn, function (err, connection) {
        if (err) {
            $happn.log.error('get connection error: ' + err);
            return callback(err);
        }

        callback(null, connection);
    });

};

module.exports = NodeRepository;
