class EventLog {
	constructor() {}

	setId(logEventObj) {
		this.serial = logEventObj.serial;
		this.typeId = logEventObj.typeId;
		this.createdAt = logEventObj.createdAt || 0;
	}

	setType(type) {
		this.logType = type;
	}

	setEvents(events) {
		this.events = events;
	}

	setCounts(counts) {
		this.counts = counts;
	}
}
module.exports = EventLog;
