const uuid = require("uuid");
const bcrypt = require("bcrypt");
const saltRounds = 10;

async function Crypt(name) {
	var salt = await bcrypt.genSaltSync(saltRounds);
	var hash = await bcrypt.hashSync(name, salt);
	return hash;
	// Store hash in your password DB.
}

async function checkUser(hash, password) {
	//... fetch user from a db etc.

	const match = await bcrypt.compare(password, hash);

	if (match) {
		return true;
	}
	return false;
}

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
			permissions: {
				methods: { "*": { authorized: true } },
				events: { "*": { authorized: true } }
			}
		},
		{
			name: "USER",
			permissions: {
				methods: { "/*": { authorized: true } },
				events: { "/*": { authorized: true } }
			}
		}
	];
}

function DefaultUsers() {
	return [
		{
			username: "AECE",
			password: "$2b$10$WD.ZxymK.d0OtXqJfAYAV.Sz0hKjAqP.tNdby0s.EqdWWcsayj/Nm",
			groups: { _ADMIN: true, ADMIN: true }
		},
		{
			username: "GUEST",
			password: "$2b$10$L100ATptH5vW5ykDg7kRhecZG/iDJJKzf8A90qhEMJIljh0m3oGTu",
			groups: { USER: true }
		}
	];
}

module.exports = { DefaultConstants, MeshTypes, DeviceTypes, Crypt, checkUser };
