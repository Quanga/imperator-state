const PacketConstructor = require("../../../lib/builders/packetConstructor");

function BlastList() {}

BlastList.prototype.createBlast1 = function() {
	let result = [];

	//packet constructor = type, serial, data

	//create a CCB
	result.push({
		message: {
			packet: new PacketConstructor(8, 8, {
				data: [0, 0, 0, 0, 0, 0, 0, 0]
			}).packet,
			created: Date.now()
		},
		wait: 1000
	});

	//create CBB 13 with main=1 dc_supply=1
	result.push({
		message: {
			packet: new PacketConstructor(5, 13, {
				data: [
					{
						serial: 13,
						childCount: 0,
						ledState: 6,
						rawData: [0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0]
					}
				]
			}).packet,
			created: Date.now()
		},
		wait: 1000
	});

	//add 2 EDDs in list command
	result.push({
		message: {
			packet: new PacketConstructor(4, 13, {
				data: [
					{ serial: 4423423, windowId: 1 },
					{ serial: 4523434, windowId: 2 }
				]
			}).packet,
			created: Date.now()
		},
		wait: 1000
	});

	//add 1 logged (first) and one tagged to the data of the EDDs
	result.push({
		message: {
			packet: new PacketConstructor(5, 13, {
				data: [
					{
						serial: 13,
						childCount: 2,
						ledState: 6,
						rawData: [0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0]
					},
					{
						windowId: 1,
						rawData: [0, 0, 0, 0, 0, 0, 0, 1],
						delay: 2000
					},
					{
						windowId: 2,
						rawData: [0, 0, 0, 0, 0, 1, 0, 0],
						delay: 3000
					}
				]
			}).packet,
			created: Date.now()
		},
		wait: 1000
	});

	//turn the keyswitch on the CBB which will arm it -
	result.push({
		message: {
			packet: new PacketConstructor(5, 13, {
				data: [
					{
						serial: 13,
						childCount: 0,
						ledState: 6,
						rawData: [0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1]
					},
					{
						windowId: 1,
						rawData: [0, 1, 0, 0, 0, 0, 1, 1],
						delay: 2000
					},
					{
						windowId: 2,
						rawData: [0, 1, 0, 0, 0, 1, 1, 0],
						delay: 3000
					}
				]
			}).packet,
			created: Date.now()
		},
		wait: 1000
	});

	//arm the CBB
	result.push({
		message: {
			packet: new PacketConstructor(8, 8, {
				data: [0, 1, 0, 0, 0, 0, 0, 1]
			}).packet,
			created: Date.now()
		},
		wait: 1000
	});

	//firebutton =i2 the CBB
	result.push({
		message: {
			packet: new PacketConstructor(8, 8, {
				data: [0, 1, 0, 0, 0, 1, 0, 1]
			}).packet,
			created: Date.now()
		},
		wait: 1000
	});

	//fire the CBB
	result.push({
		message: {
			packet: new PacketConstructor(8, 8, {
				data: [0, 1, 0, 0, 0, 0, 0, 1]
			}).packet,
			created: Date.now()
		},
		wait: 2000
	});

	//post blast return from the CBB
	result.push({
		message: {
			packet: new PacketConstructor(5, 13, {
				data: [
					{
						serial: 13,
						childCount: 0,
						ledState: 6,
						rawData: [0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1]
					},
					{
						windowId: 1,
						rawData: [0, 0, 0, 0, 0, 0, 0, 0],
						delay: 2000
					},
					{
						windowId: 2,
						rawData: [0, 0, 0, 0, 0, 0, 0, 0],
						delay: 3000
					}
				]
			}).packet,
			created: Date.now()
		},
		wait: 1000
	});

	return result;
};

module.exports = BlastList;
