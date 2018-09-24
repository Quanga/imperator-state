/**
 * Created by grant on 2016/06/17.
 */

var fs = require('fs'),
    path = require('path'),
    assert = require('assert');

describe("data-parser-test", function () {

    var MockHappn = require('../mocks/mock_happn');
    var Utils = require('../../lib/utils/packet_utils');
    var DataParser = require('../../lib/parsers/data_parser');
    var Constants = require('../../lib/constants/command_constants');

    var mockHappn = new MockHappn();
    var parser = null;
    var utils = null;
    var commandConstant = null;

    this.timeout(30000);

    before('it sets up the dependencies', function (callback) {

        utils = new Utils();
        commandConstant = (new Constants()).ibcToPiCommands[parseInt(0b00001000, 16)];  // command 8
        parser = new DataParser(commandConstant);

        callback();
    });

    it('can create a node result array with one set of node data from a parsed packet', function (callback) {

        /*
         AAAA 0A 08 0001 00C0 CA96 (event on IBC-1 id 0001 - key switch armed on IBC)
         */

        var packet = 'AAAA0A08000100C0CA96';
        var testObj = utils.splitPacket(packet);

        var expected = [
            {
                serial: 1,
                type_id: 0,
                key_switch_status: 1,
                communication_status: 1,
                temperature: null,
                blast_armed: 0,
                fire_button: 0,
                isolation_relay: 1,
                shaft_fault: null,
                cable_fault: 0,
                earth_leakage: 0,
                detonator_status: null,
                partial_blast_lfs: null,
                full_blast_lfs: null,
                booster_fired_lfs: null,
                missing_pulse_detected_lfs: null,
                AC_supply_voltage_lfs: null,
                DC_supply_voltage: null,
                DC_supply_voltage_status: null,
                mains: null,
                low_bat: null,
                too_low_bat: null,
                delay: null,
                program: null,
                calibration: null,
                det_fired: null,
                tagged: null,
                energy_storing: null,
                bridge_wire: null,
                parent_id: null,
                parent_type: 0,
                parent_serial: 1,
                tree_parent_id: null,
                window_id: null,
                crc: null,
                x: 0,
                y: 0
            }
        ];

        parser.parse(mockHappn, testObj, function (err, parsedPacketArr) {
            if (err)
                return callback(err);

            parser.buildNodeData(mockHappn, parsedPacketArr, function (err, result) {
                if (err)
                    return callback(err);

                assert.deepEqual(result, expected);
                callback();
            });
        });
    });

});



