function TransmissionService() {}

TransmissionService.prototype.initialise = function($happn) {
	$happn.log.info("initialising Transmission Service...");

	/* commands:
     0x01 - requests the ordered list of serial numbers of the connected ISC-1s
     0x02 - requests the ordered list of serial numbers of the IB651s connected to the corresponding ISC-1
     0x03 - requests the default data of the ISC-1 and IB651s
     */
	function timeout(ms) {
		return new Promise(resolve => setTimeout(resolve, ms));
	}

	let getlistAsync = async () => {
		try {
			$happn.log.info("Runing transmission inside...");

			let ibcSerial = await $happn.exchange.nodeRepository.getIbcSerials();

			if (ibcSerial) {
				//0x01
				$happn.log.info("getting IBC from repo", ibcSerial[0].serial);
				await this.buildAndAddToQueue($happn, 0b00000001, ibcSerial[0].serial);
				//$happn.log.info(`sending ${ibcSerial.serial}`, 0b00000001);

				await timeout(1000);
				let iscSerials = await $happn.exchange.nodeRepository.getIscSerials();

				$happn.log.info("getting ISCs from repo", iscSerials);

				for (let isca of iscSerials) {
					//0x02 - requests the ordered list of serial numbers of the IB651s connected to the corresponding ISC - 1
					await this.buildAndAddToQueue($happn, 0b00000010, isca.serial);
				}

				await timeout(5000);

				for (const iscb of iscSerials) {
					//0x03 - requests the default data of the ISC - 1 and IB651s -
					await this.buildAndAddToQueue($happn, 0b01000011, iscb.serial);
				}
			}

			await timeout(1000);
			getlistAsync();
		} catch (err) {
			$happn.log.error("Transmission Service Failed");
		}
	};

	return getlistAsync();
};

TransmissionService.prototype.buildAndAddToQueue = function(
	$happn,
	command,
	serial
) {
	let build = async () => {
		try {
			$happn.log.info(`BUILD AND ADD -${command}, ${serial}`);
			let buildp = await $happn.exchange.packetService.buildOutgoingPacket(
				command,
				serial
			);
			$happn.log.info("adding message to outgoing queue...: ", buildp);
			await $happn.exchange.queueService.addToOutgoingQueue(buildp);
			$happn.log.info("added message to outgoing queue...: ", buildp);
		} catch (err) {
			$happn.log.error("buildAndSend error 2", err);
		}
	};

	return build();
};

module.exports = TransmissionService;
