/**
 * Created by grant on 2016/06/23.
 */

var fs = require('fs'),
    path = require('path'),
    assert = require('assert');

describe("packet-service-test", function () {

    var PacketService = require('../../lib/services/packet_service');
    var packetService = null;

    var MockHappn = require('../mocks/mock_happn');
    var mockHappn = null;

    this.timeout(30000);

    before('it sets up the dependencies', function (callback) {

        packetService = new PacketService();
        mockHappn = new MockHappn();
        callback();
    });

    it('can parse a key switch DISARMED message and check crc', function () {

        //  FRAGMENT:  [start]  [length]    [command]    [serial] [data]  [CRC]
        //  HEX:       [AAAA]   [0A]        [08]         [0001]   [5540]  [C212]

        var testMessage = new Buffer('AAAA0A0800015540C212', 'hex');

        packetService.parseBinaryMessage(mockHappn, testMessage);
    });

    it('can parse a key switch ARMED message and check crc', function () {

        //  FRAGMENT:  [start]  [length]    [command]    [serial] [data]  [CRC]
        //  HEX:       [AAAA]   [0A]        [08]         [0001]   [55C0]  [CA96]

        var testMessage = new Buffer('AAAA0A08000155C0CA96', 'hex');

        packetService.parseBinaryMessage(mockHappn, testMessage);
        
    });

    it('can parse an IBC response packet and check crc', function () {

        //  FRAGMENT:  [start]  [length]    [command]    [serial] [data]    [CRC]
        //  HEX:       [AAAA]   [0A]        [01]         [0007]   [-]       [52D8]

        var testMessage = new Buffer('AAAA0A010001000752D8', 'hex');

        packetService.parseBinaryMessage(mockHappn, testMessage);

    });

});



