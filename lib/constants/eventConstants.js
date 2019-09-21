const eventServiceEvents = {
	UPDATE_LOG: "UPDATE_LOG",
	WARNING_LOG: "WARNING_LOG"
};

const dataServiceEvents = {
	EDD_SIGNAL_DETECTED: "EDD_SIGNAL_DETECTED",
	UNIT_COUNT_CHANGED: "UNIT_COUNT_CHANGED",
	UNITS_INSERTED: "UNITS_INSERTED",
	UNITS_UPDATED: "UNITS_UPDATED"
};

const dataModelEvents = {
	UNIT_COUNT_UPDATED: "UNIT_COUNT_UPDATED",
	UNIT_COMMS_LOST: "UNIT_COMMS_LOST"
};

const unitModelEvents = {
	UNIT_COMM_LOST: "COMM_LOST"
};



const blastServiceEvents = {
	BLAST_LOG: "BLAST_LOG"
	// BLASTMODEL_LOG: "BLASTMODEL_LOG",
	// BLAST_ERROR_LOG: "BLAST_ERROR_LOG"
};

const blastModelEvents = {
	BLASTMODEL_LOG: "BLASTMODEL_LOG"
};

module.exports = {
	eventServiceEvents,
	blastServiceEvents,
	blastModelEvents,
	dataModelEvents,
	dataServiceEvents,
	unitModelEvents
};
