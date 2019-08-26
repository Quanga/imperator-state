class WarningModel {
	constructor(eventObj) {
		this.createdAt = eventObj.createdAt;
		this.serial = eventObj.serial;
		this.typeId = eventObj.typeId;
		this.ack = false;
	}

	setWarning(warning) {
		this.id = null;
		this.warning = warning;
		this.ackDate = null;
		this.ackBy = null;
		this.ackType = null;
	}
}

module.exports = WarningModel;
