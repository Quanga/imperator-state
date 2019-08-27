const uuid = require("uuid");

function DefaultConstants() {
	const generateId = function() {
		return `AECE-${uuid.v4()}`;
	};
	return {
		system: {
			type: "AXXIS"
		},

		identifier: {
			id: generateId(),
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
}

function DeviceTypes() {
	return ["EDGE", "SERVER", "CLIENT", "TEST"];
}

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
				"intelliblast-state-001/uiService/*": { authorized: true },
				"intelliblast-state-001/blastRepository/*": { authorized: true },
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

module.exports = { DefaultConstants, DeviceTypes, defaultGroups, defaultUsers };
