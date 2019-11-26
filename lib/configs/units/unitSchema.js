const fields = require("../fields/fieldConstants");
const { communicationStatus, keySwitchStatus, fireButton, parentType } = fields;
const { typeId, logged, tagged, program } = fields;

const schemas = {
	PrimaryUnitModel: "PrimaryUnitModel",
	SecondaryUnitModel: "SecondaryUnitModel",
};

const unitSchema = {
	0: {
		name: "CONTROL UNIT",
		[typeId]: 0,
		schema: schemas.PrimaryUnitModel,
		aggregators: { 3: { state: [communicationStatus], data: [keySwitchStatus] } },
		distinct: true,
		fsm: {
			states: {
				ARMED: { [keySwitchStatus]: 1, [fireButton]: 0 },
				DISARMED: { [keySwitchStatus]: 0, [fireButton]: 0 },
				FIRING: { [keySwitchStatus]: 1, [fireButton]: 1 },
			},
			events: {
				ARMING: {
					prev: { [keySwitchStatus]: 0, [fireButton]: 0 },
					next: { [keySwitchStatus]: 1, [fireButton]: 0 },
				},
				DISARMING: {
					prev: { [keySwitchStatus]: 1, [fireButton]: 0 },
					next: { [keySwitchStatus]: 0, [fireButton]: 0 },
				},
				FIRING_PRESSED: {
					prev: { [keySwitchStatus]: 1, [fireButton]: 0 },
					next: { [keySwitchStatus]: 1, [fireButton]: 1 },
				},
				FIRING_RELEASED: {
					prev: { [keySwitchStatus]: 1, [fireButton]: 1 },
					next: { [keySwitchStatus]: 1, [fireButton]: 0 },
				},
				FIRING_ABORTED: {
					prev: { [keySwitchStatus]: 1, [fireButton]: 1 },
					next: { [keySwitchStatus]: 0, [fireButton]: 1 },
				},
				ERROR_FIRE: {
					prev: { [keySwitchStatus]: 0, [fireButton]: 0 },
					next: { [keySwitchStatus]: 0, [fireButton]: 1 },
				},
			},
		},
	},
	1: {
		name: "SECTION CONTROLLER",
		schema: schemas.PrimaryUnitModel,
		[typeId]: 2,
		[parentType]: 0,
		aggregators: [],
	},
	2: {
		name: "BOOSTER_T1",
		[typeId]: 3,
		schema: schemas.PrimaryUnitModel,
		[parentType]: 1,
	},
	3: {
		name: "BOOSTER_T2",
		[typeId]: 3,
		schema: schemas.PrimaryUnitModel,
		[parentType]: 0,
		aggregators: { 4: { data: [logged, tagged, program], state: [communicationStatus] } },
		commTimeout: 10 * 60 * 1000,
		fsm: {
			states: {
				ARMED: { [keySwitchStatus]: 1 },
				DISARMED: { [keySwitchStatus]: 0 },
			},
			events: {
				ARMING: {
					prev: { [keySwitchStatus]: 0 },
					next: { [keySwitchStatus]: 1 },
				},
				DISARMING: {
					prev: { [keySwitchStatus]: 1 },
					next: { [keySwitchStatus]: 0 },
				},
				COMM_LOST: {
					prev: { [communicationStatus]: 0 },
					next: { [communicationStatus]: 1 },
				},
				COMM_RESTORED: {
					prev: { [communicationStatus]: 0 },
					next: { [communicationStatus]: 1 },
				},
			},
		},
	},
	4: {
		name: "EDD",
		[fields.typeId]: 4,
		schema: schemas.SecondaryUnitModel,
		[fields.parentType]: 3,
		defaultOverrides: [{ [communicationStatus]: 0 }],
		fsm: {
			states: {
				LIVE: {},
				DEAD: {},
			},
			triggers: {
				ARMING: { next: { communicationStatus: 1 } },
				DISARMING: { next: { keySwitchStatus: 0 } },
			},
		},
	},
	5: {
		name: "CFC",
		[typeId]: 5,
		schema: schemas.PrimaryUnitModel,
		[parentType]: 0,
		aggregators: [],
	},
};

module.exports = unitSchema;
