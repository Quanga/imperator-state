const uuid = require("uuid");

const defaultConstants = {
	system: {
		type: "AXXIS"
	},
	identifier: {
		id: `AECE-${uuid.v4()}`,
		name: "test",
		locale: ""
	},
	communication: {
		ipAddress: "",
		endPoints: []
	},
	configuration: {
		meshType: "AXXIS",
		deviceType: "EDGE"
	},
	security: {
		secure: true
	},
	inputSource: {
		comPort: "/dev/tty.Bluetooth-Incoming-Port",
		baudRate: 9600,
		partity: "odd",
		stopBits: 1
	},
	useExternalDb: false,
	setupIssues: [],
	setupComplete: false,
	secure: false
};

const defaultGroups = [
	{
		name: "OEM",
		permissions: {
			methods: { "/*": { authorized: true } },
			events: { "/*": { authorized: true } }
		}
	},
	{
		name: "ADMIN",
		permissions: {
			methods: { "/*": { authorized: true } },
			events: { "/*": { authorized: true } }
		}
	},
	{
		name: "USER",
		permissions: {
			methods: {
				"/*": { authorized: true }
			},
			events: { "/*": { authorized: true } }
		}
	}
];

const defaultUsers = [
	{
		username: "OEM",
		password: "oem",
		application_data: {
			state: "INSECURE"
		},
		groups: { _ADMIN: true, OEM: true }
	},
	{
		username: "ADMIN",
		password: "admin",
		application_data: {
			state: "INSECURE"
		},
		groups: { ADMIN: true }
	},
	{
		username: "GUEST",
		password: "guest",
		application_data: {
			state: "INSECURE"
		},
		groups: { USER: true }
	}
];

module.exports = { defaultConstants, defaultGroups, defaultUsers };
