const outgoingCommands = require("../constants/packetTemplates").getOutgoingCommands;

function TraceService() {}

// get a list of all the devices

//turn off one device - query all other devices

//store the response of all units which did respond
TraceService.prototype.runTraceRoute = function($happn) {
	const { dataService, transmissionService } = $happn.exchange;
	const { log } = $happn;

	return (async () => {
		log.info("Running Trace Route Cycle.........");
		outgoingCommands[17];

		const units = dataService.getUnits();

		if (units && units.length > 0) {
			const unitSerials = units.reduce((acc, cur) => acc.push(cur.data.serial), []);
			for (const unitSerial of unitSerials) {
				transmissionService.transmit(outgoingCommands[17], unitSerial);
			}
		}
	})();
};

module.exports = TraceService;
