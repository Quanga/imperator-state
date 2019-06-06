const uuid = require("uuid");

class BlastModel {
	constructor(snapshot, created) {
		this.id = uuid.v4();
		this.created = created;
		this.firingComplete = created;
		this.closed = null;
		this.snapshots = { start: snapshot, end: null };
		this.logs = [];
		this.state = "FIRING";
	}

	setState(state) {
		this.state = state;
	}

	setFiringTimer(duration) {
		const firingAsync = () =>
			new Promise(resolve => {
				setTimeout(() => {
					this.firingComplete = Date.now();
					this.setState("FIRED");
					resolve();
				}, duration);
			});

		return firingAsync();
	}

	addLog(log) {
		this.logs.push(log);
	}

	endBlast(snapshot) {
		this.snapshots.end = snapshot;
	}
}

module.exports = BlastModel;
