class EventLog {
	constructor() {
		this.meta = {};
		this.data = {};
	}

	//#region Builder Methods
	static create(timeStamp) {
		if (!timeStamp || typeof timeStamp !== "number")
			throw new Error("EventLog must be created with timestamp");
		const eventLog = new EventLog();
		eventLog.meta.createdAt = timeStamp;
		return eventLog;
	}

	setLogType(logType) {
		if (!logType || typeof logType !== "string") throw new Error("Error creating LogType");

		this.meta.logType = logType;
		return this;
	}

	setSerial(serial) {
		if (!serial || typeof serial !== "number") throw new Error("Error creating serial");

		this.meta.serial = serial;
		return this;
	}

	setTypeId(typeId) {
		if (typeof typeId !== "number") throw new Error("Error creating typeId");

		this.meta.typeId = typeId;
		return this;
	}

	setEvents() {
		this.data.events = Object.keys(this.message).reduce((acc, cur) => {
			acc[cur] = this.message[cur].map((unit) => {
				const log = { meta: { ...unit.nextState.meta } };
				if (Object.keys(unit.diffs).length > 0) log.diffs = { ...unit.diffs };
				return log;
			});
			return acc;
		}, {});

		delete this.message;

		return this;
	}

	setCounts(counts) {
		this.data.counts = counts;
	}

	withMessage(message) {
		if (typeof message === "string") {
			this.message = message;
		} else {
			this.message = this.reduceLogs(message);
		}
		return this;
	}

	//#endregion

	//#region Utilities
	reduceLogs(payload) {
		return payload.reduce((acc, cur) => {
			if (!Object.prototype.hasOwnProperty.call(acc, cur.value.nextState.meta.typeId)) {
				acc[cur.value.nextState.meta.typeId] = [];
			}

			acc[cur.value.nextState.meta.typeId].push(cur.value);
			return acc;
		}, {});
	}
	get log() {
		return { meta: { ...this.meta }, data: { ...this.data } };
	}
	//#endregion
}
module.exports = EventLog;
