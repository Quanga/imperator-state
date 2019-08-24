class EventLog {
	constructor() {}

	setId(logEventObj) {
		this.serial = logEventObj.serial;
		this.typeId = logEventObj.typeId;
		this.created = logEventObj.created;
	}

	setType(type) {
		this.logType = type;
	}

	setEvents(events) {
		this.events = events;
	}
}
module.exports = EventLog;
