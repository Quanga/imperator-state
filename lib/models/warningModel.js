const uuid = require("uuid");

class WarningModel {
	constructor(eventObj) {
		this.createdAt = eventObj.meta.createdAt;
		this.serial = eventObj.meta.serial;
		this.typeId = eventObj.meta.typeId;
		this.ack = false;
	}

	setWarning(warning) {
		this.id = uuid.v4();
		this.warning = warning;
		this.ackDate = null;
		this.ackBy = null;
		this.ackType = null;
	}
}

module.exports = WarningModel;
