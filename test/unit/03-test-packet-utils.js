/**
 * Created by grant on 2016/06/17.
 */

var fs = require('fs'),
    path = require('path'),
    assert = require('assert');

describe("packet-utils-test", function () {

    var Utils = require('../../lib/utils/packet_utils');
    var utils = null;

    var MockHappn = require('../mocks/mock_happn');
    var mockHappn = new MockHappn();

    this.timeout(30000);

    before('it sets up the dependencies', function (callback) {

        utils = new Utils();
        callback();
    });

    it('can calculate the correct packet length', function (callback) {

        /*
         AAAA 0A 03 0001 4040 07BE
         */

        var expected = '0a';
        var result = utils.calculatePacketLength('03', '0001', '4040'); // incoming CRC stripped off end
        assert.equal(result, expected);
        callback();
    });

    it('can calculate the CRC of a packet with event on IBC-1 serial 0001 and key switch disarmed on IBC', function (callback) {

        /*
         AAAA 0A 08 0001 5540 C212 (event on IBC-1 id 0001 - key switch disarmed on IBC)
         */

        var expected = 0xc212;
        var result = utils.generateCRC('AAAA0A0800015540'); // incoming CRC stripped off end
        console.log(result.toString(16));
        assert.equal(result, expected);
        callback();
    });

    it('can calculate the CRC of a packet with event on IBC-1 serial 0001 and key switch armed on IBC', function (callback) {
        /*
         AAAA 0A 08 0001 55C0 CA96 (event on IBC-1 id 0001 - key switch armed on IBC)
         */

        var expected = 0xca96;
        var result = utils.generateCRC('AAAA0A08000155C0'); // incoming CRC stripped off end
        assert.equal(result, expected);
        callback();
    });

    it('can calculate the CRC of a packet where the CRC starts with a 0', function (callback) {
        /*
         AAAA 0A 03 0001 4040 07BE
         */

        var expected = 0x07be;
        var result = utils.generateCRC('AAAA0A0300014040'); // incoming CRC stripped off end
        console.log(result.toString(16));
        assert.equal(result, expected);
        callback();
    });

    it('can create an outgoing packet requesting ISC serial list with a valid CRC', function (callback) {
        /*
         AAAA 01 0001 DD5C
         */

        var expected = 'AAAA010001DD5C'.match(/.{1,2}/g).map(x => {
            return parseInt(x, 16);
        });

        var command = 0b00000001;
        var serial = 0b0000000000000001;

        var result = utils.buildOutgoingPacket(mockHappn, command, serial);

        assert.deepEqual(result, expected);
        callback();
    });

    it('can create an outgoing packet requesting ISC and IB651 general info with a valid CRC', function (callback) {
        /*
         AAAA 03 0007 538C
         */

        var expected = 'AAAA030007538C'.match(/.{1,2}/g).map(x => {
            return parseInt(x, 16);
        });

        var command = 0b00000011;
        var serial = 0b0000000000000111;

        var result = utils.buildOutgoingPacket(mockHappn, command, serial);

        assert.deepEqual(result, expected);
        callback();
    });

});



