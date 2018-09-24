/**
 * Created by grant on 2016/07/20.
 */

/*

 IBC-1 TO RPI
 =============
 Fragment breakdown:
 start: 16 bit (2 bytes)
 length: 8 bit (1 byte)
 command: 8 bit (1 byte)
 serial: 16 bit (2 bytes)
 data: 16 bit [ID - 8 bits split into device type (3 bits) + device id (5 bits)] + [Raw Data (8 bits)]
 crc: 16 bit (2 bytes)

 eg 1: AAAA0A0800015540C212 (event on IBC-1 id 0001 - key switch disarmed on IBC)

 FRAGMENT:  [start]             [length]    [command]   [serial]    [data]              [CRC]
 HEX:       [AAAA]              [0A]        [08]        [0001]      [5540]              [C212]
 BINARY:    [1010101010101010]  [1010]      [1000]      [0001]      [01010101 01000000]  [1100001000010010]

 DATA:
 1st 8 bit fragment (55 hex / 010 10101 bin) - device type: 010 (ie: 'isc-1'), device id: 10101 (ie: '21')
 2nd 8 bit fragment (40 hex / 01000000 bin) - raw data


 RPI TO IBC-1
 ============
 Fragment breakdown:
 start: 16 bit
 command: 8 bit
 serial: 16 bit
 crc: 16 bit

 Bit numbering:
 ==============
 LSB = 0 (little endian) - ie: bit 7 = MSB, bit 0 = LSB, where bit 0 is the 'right-most' bit.

 */


var PacketBuilder = function () {
	var PacketUtils = require('../utils/packet_utils');
	this.utils = new PacketUtils();
	this.reset();
};

PacketBuilder.prototype.reset = function () {
	this.start = null;
	this.length = null;
	this.command = null;
	this.serial = null;
	this.deviceData = null;
	this.serialData = null;
	this.data = [];
	this.crc = null;
};

PacketBuilder.prototype.withStart = function (data) {
	var self = this;
	this.start = pad(data.toString(16), 4);
	console.log('Start: ' + this.start);
	return self;
};

PacketBuilder.prototype.withCommand = function (data) {
	var self = this;
	this.command = pad(data.toString(16), 2);
	console.log('Command: ' + this.command);
	return self;
};

PacketBuilder.prototype.withSerial = function (data) {
	var self = this;
	this.serial = pad(data.toString(16), 4);
	console.log('Serial: ' + this.serial);
	return self;
};

// first 3 bits of the data is the device type
PacketBuilder.prototype.createDeviceTypeData = function (data) {
	var deviceTypeData = pad(data.toString(2), 3);
	console.log('Device type: ' + deviceTypeData);
	return deviceTypeData;
};

// next 5 bits of the data is the device id
PacketBuilder.prototype.createDeviceIdData = function (data) {
	var deviceIdData = pad(data.toString(2), 5);
	console.log('Device id: ' + deviceIdData);
	return deviceIdData;
};

// remaining 8 bits of the data is the raw data
PacketBuilder.prototype.createRawData = function (data) {
	var joinedData = data.reverse().join('');
	var rawData = pad(joinedData.toString(2), 8);
	console.log('Raw data: ' + rawData);
	return rawData;
};

PacketBuilder.prototype.withSerialData = function (data) {
	var self = this;

	if (this.serialData == null)
		this.serialData = [];

	this.serialData.push(pad(data.toString(16), 4));
	console.log('Serial data: ' + this.serialData);
	return self;
};

PacketBuilder.prototype.withDeviceData = function (data) {
	var self = this;

	if (this.deviceData == null)
		this.deviceData = [];

	console.log('Device data: ' + data);
	this.deviceData.push(this.utils.binaryToHexString(data, 4));
	return self;
};

PacketBuilder.prototype.build = function () {

	//     FRAGMENT:  [start]             [length]    [command]   [serial]    [data]              [CRC]
	//     HEX:       [AAAA]              [0A]        [08]        [0001]      [5540]              [C212]
	//     BINARY:    [1010101010101010]  [1010]      [1000]      [0001]      [01010101 01000000]  [1100001000010010]


	// create the full data fragment
	var data = this.deviceData != null ? this.deviceData.join('') : this.serialData.join('');
	console.log('Data: ' + data);

	//calculate the packet length
	this.length = pad(this.utils.calculatePacketLength(this.command, this.serial, data), 2);

	// generate the CRC
	var preCrc = this.start + this.length + this.command + this.serial + data;
	this.crc = this.utils.pad((this.utils.generateCRC(preCrc)).toString(16), 4);

	return (preCrc + this.crc);
};

function pad(str, len) {
	var start = '';

	while (start.length < len) {
		start += '0';
	}

	return (start + str.toString(16)).substr(-len);
}

module.exports = PacketBuilder;