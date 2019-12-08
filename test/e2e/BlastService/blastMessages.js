const PktBldr = require("imperator-packet-constructor");

function BlastList() {}

BlastList.prototype.createBlast1 = function() {
	let result = [];

	//packet constructor = type, serial, data
	let started = Date.now();
	//create a CCB
	result.push({
		message: {
			packet: PktBldr.withCommand(8)
				.withParent(8)
				.withData([0, 0, 0, 0, 0, 0, 0, 0])
				.build(),
			createdAt: started,
		},
		wait: 1000,
	});

	//create CBB 13 with main=1 dc_supply=1
	result.push({
		message: {
			packet: PktBldr.withCommand(5)
				.withParent(13)
				.withData([
					{
						serial: 13,
						childCount: 0,
						ledState: 6,
						rawData: [0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0],
					},
				])
				.build(),
			createdAt: started + 5000,
		},
		wait: 1000,
	});

	//create CBB 14 with main=1 dc_supply=1
	result.push({
		message: {
			packet: PktBldr.withCommand(5)
				.withParent(14)
				.withData([
					{
						serial: 14,
						childCount: 0,
						ledState: 6,
						rawData: [0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0],
					},
				])
				.build(),
			createdAt: started + 15000,
		},
		wait: 1000,
	});

	//create CBB 15 with main=1 dc_supply=1
	result.push({
		message: {
			packet: PktBldr.withCommand(5)
				.withParent(15)
				.withData([
					{
						serial: 14,
						childCount: 0,
						ledState: 6,
						rawData: [0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0],
					},
				])
				.build(),
			createdAt: started + 25000,
		},
		wait: 1000,
	});

	//create CBB 16 with main=1 dc_supply=1
	result.push({
		message: {
			packet: PktBldr.withCommand(5)
				.withParent(16)
				.withData([
					{
						serial: 16,
						childCount: 0,
						ledState: 6,
						rawData: [0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0],
					},
				])
				.build(),
			createdAt: started + 35000,
		},
		wait: 1000,
	});

	//add 2 EDDs in list command to 13
	result.push({
		message: {
			packet: PktBldr.withCommand(4)
				.withParent(13)
				.withData([
					{ serial: 4423423, windowId: 1 },
					{ serial: 4523434, windowId: 2 },
				])
				.build(),
			createdAt: started + 45000,
		},
		wait: 1000,
	});

	//add 2 EDDs in list command to 14
	result.push({
		message: {
			packet: PktBldr.withCommand(4)
				.withParent(14)
				.withData([
					{ serial: 4423478, windowId: 1 },
					{ serial: 4523479, windowId: 2 },
				])
				.build(),
			createdAt: Date.now(),
		},
		createdAt: started + 55000,
	});

	result.push({
		message: {
			packet: PktBldr.withCommand(4)
				.withParent(15)
				.withData([
					{ serial: 4423481, windowId: 1 },
					{ serial: 4523482, windowId: 2 },
				])
				.build(),
			createdAt: Date.now(),
		},
		createdAt: started + 55000,
	});

	//add to 14 1 logged (first) and one tagged to the data of the EDDs
	result.push({
		message: {
			packet: PktBldr.withCommand(5)
				.withParent(13)
				.withData([
					{
						serial: 13,
						childCount: 2,
						ledState: 6,
						rawData: [0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0],
					},
					{
						windowId: 1,
						rawData: [1, 1, 0, 0, 1, 1, 1, 0],
						delay: 2000,
					},
					{
						windowId: 2,
						rawData: [1, 1, 0, 0, 1, 1, 1, 0],
						delay: 3000,
					},
				])
				.build(),
			createdAt: started + 65000,
		},
		wait: 1000,
	});

	//add to 15 1 logged (first) and one tagged to the data of the EDDs
	result.push({
		message: {
			packet: PktBldr.withCommand(5)
				.withParent(15)
				.withData([
					{
						serial: 15,
						childCount: 2,
						ledState: 6,
						rawData: [0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0],
					},
					{
						windowId: 1,
						rawData: [1, 1, 0, 0, 1, 1, 1, 0],
						delay: 2000,
					},
					{
						windowId: 2,
						rawData: [1, 1, 0, 0, 1, 1, 1, 0],
						delay: 3000,
					},
				])
				.build(),
			createdAt: started + 75000,
		},
		wait: 1000,
	});

	//turn the keyswitch on the CBB 14 which will arm it -
	result.push({
		message: {
			packet: PktBldr.withCommand(5)
				.withParent(14)
				.withData([
					{
						serial: 14,
						childCount: 2,
						ledState: 6,
						rawData: [0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1],
					},
					{
						windowId: 1,
						rawData: [1, 1, 0, 0, 1, 1, 1, 0],
						delay: 2000,
					},
					{
						windowId: 2,
						rawData: [1, 1, 0, 0, 1, 1, 1, 0],
						delay: 3000,
					},
				])
				.build(),
			createdAt: started + 85000,
		},
		wait: 1000,
	});

	//turn the keyswitch on the CBB 16 which will arm it -
	result.push({
		message: {
			packet: PktBldr.withCommand(5)
				.withParent(16)
				.withData([
					{
						serial: 16,
						childCount: 0,
						ledState: 6,
						rawData: [0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1],
					},
				])
				.build(),
			createdAt: started + 95000,
		},
		wait: 1000,
	});

	//arm the CCB
	result.push({
		message: {
			packet: PktBldr.withCommand(8)
				.withParent(8)
				.withData([0, 1, 0, 0, 0, 0, 0, 1])
				.build(),
			createdAt: started + 100500,
		},
		wait: 1000,
	});

	//firebutton =i2 the CBB
	result.push({
		message: {
			packet: PktBldr.withCommand(8)
				.withParent(8)
				.withData([0, 1, 0, 0, 0, 1, 0, 1])
				.build(),
			createdAt: started + 110500,
		},
		wait: 1000,
	});

	//fire button off
	result.push({
		message: {
			packet: PktBldr.withCommand(8)
				.withParent(8)
				.withData([0, 1, 0, 0, 0, 0, 0, 1])
				.build(),
			createdAt: started + 210500,
		},
		wait: 2000,
	});

	//disarm the CCB

	result.push({
		message: {
			packet: PktBldr.withCommand(8)
				.withParent(8)
				.withData([0, 0, 0, 0, 0, 0, 0, 0])
				.build(),
			createdAt: started + 230500,
		},
		wait: 2000,
	});

	//post blast return from the CBB
	result.push({
		message: {
			packet: PktBldr.withCommand(5)
				.withParent(14)
				.withData([
					{
						serial: 14,
						childCount: 0,
						ledState: 6,
						rawData: [0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1],
					},
					{
						windowId: 1,
						rawData: [1, 0, 0, 1, 1, 1, 0, 0],
						delay: 2000,
					},
					{
						windowId: 2,
						rawData: [1, 0, 0, 1, 1, 1, 0, 0],
						delay: 3000,
					},
				])
				.build(),
			createdAt: started + 330500,
		},
		wait: 1000,
	});
	return result;
};

module.exports = BlastList;
