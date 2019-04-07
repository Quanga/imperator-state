const uuid = require("uuid");

function DefaultConstants() {
	const generateId = function() {
		return `AECE-${uuid.v4()}`;
	};
	return {
		id: generateId(),
		name: "",
		locale: "",
		deviceType: "EDGE",
		meshType: "IBS",
		setupComplete: true,
		inputSource: {
			comPort: "",
			baudRate: 9600,
			partity: "odd",
			stopBits: 1
		},
		useExternalDb: false
	};
}

module.exports = DefaultConstants;
