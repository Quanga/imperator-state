const fields = require("../fields/fieldConstants");

module.exports = {
	fsm: {
		states: {
			starting: {  },
			firing: {  },
            watching: { },
            timer_complete:{}:
		},
		events: {
			COMM: {},
			DISARMING: {
			ERROR_FIRE: {
				prev: { [keySwitchStatus]: 0, [fireButton]: 0 },
				next: { [keySwitchStatus]: 0, [fireButton]: 1 },
			},
		},
	},
};
