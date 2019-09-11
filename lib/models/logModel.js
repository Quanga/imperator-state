class EventLog {
	constructor() {}

	setId(logEventObj) {
		const { logType, serial, typeId, createdAt } = logEventObj;

		this.logType = logType;
		this.serial = serial;
		this.typeId = typeId;
		this.createdAt = createdAt || 0;
	}

	setEvents(events) {
		this.events = events;
	}

	setCounts(counts) {
		this.counts = counts;
	}

	setBlastLog(blastMsg) {
		this.state = { blastMsg };
	}
}
module.exports = EventLog;
