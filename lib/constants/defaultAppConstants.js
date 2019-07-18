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
			secure: true,
			defaultGroups: new DefaultGroups(),
			defaultUsers: new DefaultUsers()
		},
		inputSource: {
			comPort: "/dev/tty.Bluetooth-Incoming-Port",
			baudRate: 9600,
			partity: "odd",
			stopBits: 1
		},
		useExternalDb: false,
		setupIssues: [],
		setupComplete: false
	};
}

function MeshTypes() {
	return ["IBS", "AXXIS", "HYDRADET"];
}

function DeviceTypes() {
	return ["EDGE", "SERVER", "CLIENT", "TEST"];
}

function DefaultGroups() {
	return [
		{
			name: "ADMIN",
			custom_data: "Mesh Administrator",
			permissions: {
				methods: {
					"*": { authorized: true }
				},
				events: {
					"*": { authorized: true }
				}
			}
		},
		{
			name: "USER",
			custom_data: "Mesh User",
			permissions: {
				methods: {
					"/*": { authorized: true }
				},
				events: {
					"/*": { authorized: true }
				}
			}
		}
	];
}

function DefaultUsers() {
	return [
		{
			username: "AECE",
			password: "admin",
			custom_data: {
				something: "useful"
			},
			application_data: {
				something: "untouchable by the user"
			},
			groups: { _ADMIN: true, ADMIN: true }
		},
		{
			username: "GUEST",
			password: "guest",
			custom_data: {
				something: "useful"
			},
			application_data: {
				something: "untouchable by the user"
			},
			groups: { USER: true }
		}
	];
}

module.exports = { DefaultConstants, MeshTypes, DeviceTypes };
