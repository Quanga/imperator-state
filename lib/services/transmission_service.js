function TransmissionService() {}

TransmissionService.prototype.initialise = function($happn) {
	var self = this;
	$happn.log.info("initialising Transmission Service...");

	/* commands:
     0x01 - requests the ordered list of serial numbers of the connected ISC-1s
     0x02 - requests the ordered list of serial numbers of the IB651s connected to the corresponding ISC-1
     0x03 - requests the default data of the ISC-1 and IB651s
     */

	async function getlist() {
		try {
			let ibcSerials = await $happn.exchange.dataService.getIbcSerials($happn);
			$happn.log.info("getting IBC from repo", ibcSerials);
			for (const ibc of ibcSerials) {
				//0x01 - requests the ordered list of serial numbers of the connected ISC - 1s
				await self.buildAndAddToQueue($happn, 0b00000001, ibc.serial);
			}

			let iscSerials = await $happn.exchange.dataService.getIscSerials(
				$happn,
				ibcSerials
			);
			$happn.log.info("getting ISC from repo", iscSerials);

			for (const isc of iscSerials) {
				//0x02 - requests the ordered list of serial numbers of the IB651s connected to the corresponding ISC - 1
				await self.buildAndAddToQueue($happn, 0b00000010, isc.serial);
			}

			await timeout(5000);

			for (const isc of iscSerials) {
				//0x03 - requests the default data of the ISC - 1 and IB651s
				await self.buildAndAddToQueue($happn, 0b01000011, isc.serial);
			}

			await timeout(1000);
		} catch (err) {
			$happn.log.error("Transmission Service Failed");
			return new Promise.reject(err);
		}

		getlist();
	}

	function timeout(ms) {
		return new Promise(resolve => setTimeout(resolve, ms));
	}

	return getlist();
};

TransmissionService.prototype.buildAndAddToQueue = function(
	$happn,
	command,
	serial
) {
	let build = async function() {
		try {
			let buildp = await $happn.exchange.packetService.buildOutgoingPacket(
				command,
				serial
			);
			//$happn.log.info("adding message to outgoing queue...: ", buildp);
			await $happn.exchange.queueService.addToOutgoingQueue(buildp);
			return Promise.resolve();
		} catch (err) {
			$happn.log.error("buildAndSend error 2", err);
			return Promise.reject(err);
		}
	};

	return build();
};

module.exports = TransmissionService;
