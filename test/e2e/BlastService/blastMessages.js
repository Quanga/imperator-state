const PacketConstructor = require("../../../lib/builders/packetConstructor");

function BlastList() {}

BlastList.prototype.createBlast1 = function() {
	let result = [];

	//packet constructor = type, serial, data
	let started = Date.now();
	//create a CCB
	result.push({
		message: {
			packet: new PacketConstructor(8, 8, {
				data: [0, 0, 0, 0, 0, 0, 0, 0]
			}).packet,
			createdAt: started
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
			createdAt: started + 5000
		},
		wait: 1000
	});

	//create CBB 14 with main=1 dc_supply=1
	result.push({
		message: {
			packet: new PacketConstructor(5, 14, {
				data: [
					{
						serial: 14,
						childCount: 0,
						ledState: 6,
						rawData: [0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0]
					}
				]
			}).packet,
			createdAt: started + 15000
		},
		wait: 1000
	});

	//create CBB 15 with main=1 dc_supply=1
	result.push({
		message: {
			packet: new PacketConstructor(5, 15, {
				data: [
					{
						serial: 14,
						childCount: 0,
						ledState: 6,
						rawData: [0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0]
					}
				]
			}).packet,
			createdAt: started + 25000
		},
		wait: 1000
	});

	//create CBB 16 with main=1 dc_supply=1
	result.push({
		message: {
			packet: new PacketConstructor(5, 16, {
				data: [
					{
						serial: 14,
						childCount: 0,
						ledState: 6,
						rawData: [0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0]
					}
				]
			}).packet,
			createdAt: started + 35000
		},
		wait: 1000
	});

	//add 2 EDDs in list command to 13
	result.push({
		message: {
			packet: new PacketConstructor(4, 13, {
				data: [{ serial: 4423423, windowId: 1 }, { serial: 4523434, windowId: 2 }]
			}).packet,
			createdAt: started + 45000
		},
		wait: 1000
	});

	//add 2 EDDs in list command to 14
	result.push({
		message: {
			packet: new PacketConstructor(4, 14, {
				data: [{ serial: 4423478, windowId: 1 }, { serial: 4523479, windowId: 2 }]
			}).packet,
			createdAt: Date.now()
		},
		createdAt: started + 55000
	});

	//add to 14 1 logged (first) and one tagged to the data of the EDDs
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
			createdAt: started + 65000
		},
		wait: 1000
	});

	//add to 15 1 logged (first) and one tagged to the data of the EDDs
	result.push({
		message: {
			packet: new PacketConstructor(5, 15, {
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
			createdAt: started + 75000
		},
		wait: 1000
	});

	//turn the keyswitch on the CBB 14 which will arm it -
	result.push({
		message: {
			packet: new PacketConstructor(5, 13, {
				data: [
					{
						serial: 13,
						childCount: 2,
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
			createdAt: started + 85000
		},
		wait: 1000
	});

	//turn the keyswitch on the CBB 16 which will arm it -
	result.push({
		message: {
			packet: new PacketConstructor(5, 13, {
				data: [
					{
						serial: 13,
						childCount: 0,
						ledState: 6,
						rawData: [0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1]
					}
				]
			}).packet,
			createdAt: started + 95000
		},
		wait: 1000
	});

	//arm the CCB
	result.push({
		message: {
			packet: new PacketConstructor(8, 8, {
				data: [0, 1, 0, 0, 0, 0, 0, 1]
			}).packet,
			createdAt: started + 100500
		},
		wait: 1000
	});

	//firebutton =i2 the CBB
	result.push({
		message: {
			packet: new PacketConstructor(8, 8, {
				data: [0, 1, 0, 0, 0, 1, 0, 1]
			}).packet,
			createdAt: started + 110500
		},
		wait: 1000
	});

	//fire button off
	result.push({
		message: {
			packet: new PacketConstructor(8, 8, {
				data: [0, 1, 0, 0, 0, 0, 0, 1]
			}).packet,
			createdAt: started + 210500
		},
		wait: 2000
	});

	//disarm the CCB

	result.push({
		message: {
			packet: new PacketConstructor(8, 8, {
				data: [0, 0, 0, 0, 0, 0, 0, 0]
			}).packet,
			createdAt: started + 230500
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
						rawData: [0, 1, 1, 1, 1, 0, 0, 1],
						delay: 2000
					},
					{
						windowId: 2,
						rawData: [0, 1, 1, 1, 1, 0, 0, 1],
						delay: 3000
					}
				]
			}).packet,
			createdAt: started + 330500
		},
		wait: 1000
	});
	return result;
};

module.exports = BlastList;
