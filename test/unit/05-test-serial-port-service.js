/**
 * Created by grant on 2016/07/19.
 */

var fs = require('fs'),
    path = require('path'),
    assert = require('assert');

describe("serial-port-service-test", function () {

    var SerialPortService = require('../../lib/services/serial_port_service');
    var serialPortService = null;

    var MockHappn = require('../mocks/mock_happn');
    var mockHappn = null;

    this.timeout(30000);

    before('it sets up the dependencies', function (callback) {

        serialPortService = new SerialPortService();
        mockHappn = new MockHappn();
        callback();
    });

    it('successfully initialises the serial port service', function () {

        serialPortService.initialise(mockHappn);
    });
});