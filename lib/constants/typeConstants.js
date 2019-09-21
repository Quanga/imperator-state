const eventServiceLogTypes = {
	UNIT_INSERT: "UNIT_INSERT",
	DET_INSERT: "DET_INSERT",
	UNIT_UPDATE: "UNIT_UPDATE",
	DET_UPDATE: "DET_UPDATE",
	UNIT_COUNT: "UNIT_COUNT",
	EDD_SIG: "EDD_SIG",
	BLAST_EVENT: "BLAST_EVENT"
};

const unitTypes = {
	CONTROL_UNIT: 0,
	SECTION_CONTROLLER: 1,
	BOOSTER_T1: 2,
	BOOSTER_T2: 3,
	EDD: 4,
	CFC: 5
};

module.exports = {
	unitTypes,
	eventServiceLogTypes
};
