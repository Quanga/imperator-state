function TransmissionService() {
	this.timeout = function(ms) {
		return new Promise(resolve => setTimeout(resolve, ms));
	};
}

TransmissionService.prototype.initialise = function($happn) {
	const { info: logInfo, error: logError } = $happn.log;
	const { nodeRepository } = $happn.exchange;

	logInfo("initialising Transmission Service...");

	/* commands:
     0x01 - requests the ordered list of serial numbers of the connected ISC-1s
     0x02 - requests the ordered list of serial numbers of the IB651s connected to the corresponding ISC-1
     0x03 - requests the default data of the ISC-1 and IB651s
     */

	let getlistAsync = async () => {
		try {
			let ibcSerial = await nodeRepository.getSerialsByType(0);

			//coment this out for ibs
			//ibcSerial = [];

			if (ibcSerial && ibcSerial.length > 0) {
				//0x01
				await this.buildAndAddToQueue($happn, 0b00000001, ibcSerial[0].serial);

				await this.timeout(1000);
				let iscSerials = await nodeRepository.getSerialsByType(1);

				for (let isca of iscSerials) {
					//0x02 - requests the ordered list of serial numbers of the IB651s connected to the corresponding ISC - 1
					await this.buildAndAddToQueue($happn, 0b00000010, isca.serial);
				}

				await this.timeout(5000);

				for (const iscb of iscSerials) {
					//0x03 - requests the default data of the ISC - 1 and IB651s -
					await this.buildAndAddToQueue($happn, 0b01000011, iscb.serial);
				}
			}

			await this.timeout(1000);
			getlistAsync();
		} catch (err) {
			logError("Transmission Service Failed", err);
		}
	};

	return getlistAsync();
};

TransmissionService.prototype.buildAndAddToQueue = function($happn, cmd, srl) {
	const { info: logInfo, error: logError } = $happn.log;
	const { packetService, queueService } = $happn.exchange;

	let build = async () => {
		try {
			let buildp = await packetService.buildOutgoingPacket(cmd, srl);
			await queueService.addToOutgoingQueue(buildp);

			logInfo("added message to outgoing queue...: ", buildp);
		} catch (err) {
			logError("buildAndSend error", err);
		}
	};

	return build();
};

module.exports = TransmissionService;
