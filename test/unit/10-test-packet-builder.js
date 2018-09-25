/**
 * Created by grant on 2016/10/26.
 */

var assert = require('assert');

describe("packet-builder-test", function () {

	this.timeout(30000);

	it('successfully creates a data packet', function (callback) {

		/*
         key switch DISARMED on IBC serial 8

         start  length  command serial  data    crc
         AAAA   0A      08      0008    5540    DC8E
         */

		/*
         raw data bits:
         ==============
         unused_1: default: 0
         unused_2: default: 0
         unused_3: default: 0
         earth_leakage: no_fault: 0, fault: 1
         cable_fault: no_fault: 0, fault: 1
         fire_button: open: 0, pressed: 1
         isolation_relay: open: 0, closed: 1
         key_switch_status: disarm: 0, arm: 1

         */

		const StringBuilder = require('../../lib/builders/string_builder');
		let stringBuilder = new StringBuilder();

		const PacketBuilder = require('../../lib/builders/packet_builder');
		let packetBuilder = new PacketBuilder();

		let deviceId = packetBuilder.createDeviceIdData(21);
		let deviceType = packetBuilder.createDeviceTypeData(2);
		let rawData = packetBuilder.createRawData([0, 0, 0, 0, 0, 0, 1, 0]);

		var deviceData = stringBuilder
			.append(deviceId)
			.to(deviceType)
			.and(rawData)
			.complete();

		var result = packetBuilder
			.withStart('AAAA')
			.withCommand(8) //
			.withSerial(8)
			.withDeviceData(deviceData)
			.build();

		assert.equal(result.toUpperCase(), 'AAAA0A0800085540DC8E');

		callback();
	});

	it('successfully creates a serial list packet', function (callback) {

		/*
         ISC serial list for IBC id 8

         start  length  command serial  isc1    isc2    isc3    isc4    isc5    isc6    isc7    crc
         AAAA   16      01      0008    0025    0026    002E    0032    002A    0012    002C    7BCA
         */

		var PacketBuilder = require('../../lib/builders/packet_builder');
		var packetBuilder = new PacketBuilder();

		var result = packetBuilder
			.withStart('AAAA')
			.withCommand(1)
			.withSerial(8)
			.withSerialData(37)
			.withSerialData(38)
			.withSerialData(46)
			.withSerialData(50)
			.withSerialData(42)
			.withSerialData(18)
			.withSerialData(44)
			.build();

		assert.equal(result.toUpperCase(), 'AAAA1601000800250026002E0032002A0012002C7BCA');

		callback();
	});

	it('successfully creates a data list packet', function (callback) {

		// [000]	indicates the device is an IBC-1
		// [001]	indicates the device is an IB651 Booster
		// [010]	indicates the device is an ISC-1

		/*
         ISC and IB651 data

         start  length  command ISC serial  ISC data    IB651 data  CRC
         AAAA   0C      03      0004        4040        210E        CAF6
         AAAA   0C      03      0025        4040        210E        1F9D

         data:
         =====
         first_byte (ISC data):
         unused_1: default: 0
         unused_2: default: 0
         unused_3: default: 0
         earth_leakage: no_fault: 0, fault: 1
         cable_fault: no_fault: 0, fault: 1
         blast_armed: disarmed: 0, armed: 1
         isolation_relay: open: 0, closed: 1
         key_switch_status: disarm: 0, arm: 1

         remaining_bytes (ib651 data):
         unused_1: default: 0
         missing_pulse_detected_lfs: not_removed: 0, removed: 1
         partial_blast_lfs: no_partial_blast: 0, mains_present_for_more_than_5s: 1
         booster_fired_lfs: booster_did_not_fire: 0, booster_fired: 1
         mains: not_present: 0, present_for_more_than_15s: 1
         detonator_status: not_connected: 0, connected: 1
         key_switch_status: disarm: 0, arm: 1
         dc_supply_voltage: wrong: 0, OK: 1

         */

		var StringBuilder = require('../../lib/builders/string_builder');
		var stringBuilder = new StringBuilder();

		var PacketBuilder = require('../../lib/builders/packet_builder');
		var packetBuilder = new PacketBuilder();

		// ISC data: 0100 0000 0100 0000 (4040 hex)
		var deviceId = packetBuilder.createDeviceIdData(0); // unknown id
		var deviceType = packetBuilder.createDeviceTypeData(2); // binary 010: ISC
		var rawData = packetBuilder.createRawData([0, 0, 0, 0, 0, 0, 1, 0]);

		var deviceData = stringBuilder
			.append(deviceId)
			.to(deviceType)
			.and(rawData)
			.complete();

		// IB651 data: 0010 0001 0000 1110 (210E hex)
		var deviceId2 = packetBuilder.createDeviceIdData(1); // device id 1
		var deviceType2 = packetBuilder.createDeviceTypeData(1); // binary 001: IB251
		var rawData2 = packetBuilder.createRawData([0, 1, 1, 1, 0, 0, 0, 0]);

		var deviceData2 = stringBuilder
			.append(deviceId2)
			.to(deviceType2)
			.and(rawData2)
			.complete();

		// final packet
		var result = packetBuilder
			.withStart('AAAA')
			.withCommand(3)
			.withSerial(4)
			.withDeviceData(deviceData)
			.withDeviceData(deviceData2)
			.build();

		assert.equal(result.toUpperCase(), 'AAAA0C0300044040210ECAF6');

		callback();
	});
});