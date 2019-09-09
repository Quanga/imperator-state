const eventServiceEvents = {
	UPDATE_LOG: "UPDATE_LOG"
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

const eventServiceLogTypes = {
	UNIT_INSERT: "UNIT_INSERT",
	DET_INSERT: "DET_INSERT",
	UNIT_UPDATE: "UNIT_UPDATE",
	DET_UPDATE: "DET_UPDATE",
	UNIT_COUNT: "UNIT_COUNT",
	EDD_SIG: "EDD_SIG",
	BLAST_EVENT: "BLAST_EVENT"
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
	eventServiceLogTypes,
	blastServiceEvents,
	blastModelEvents,
	dataModelEvents,
	dataServiceEvents
};
