const uuid = require("uuid");

class BlastModel {
	constructor($happn, snapshot, created) {
		const snapShotProcessed = this.createSnapshot(snapshot);

		this.data = {
			id: uuid.v4(),
			created: created,
			firingComplete: created,
			firingTime: null,
			blastClosed: null,
			blastReturnTime: null,
			snapshots: { start: snapShotProcessed.snapShotObj, end: null },
			logs: [],
			state: "BLAST_FIRING"
		};
		this.timer = null;
		this.emitter = $happn;
		this.blastWatch = snapShotProcessed.blastWatch;
	}

	createSnapshot(snapShot) {
		const { controlUnit, units } = snapShot;
		try {
			const snapShotObj = {
				controlUnit,
				blastUnits: {},
				excludedUnits: {},
				disarmedUnits: {}
			};

			//check which units are armed and have detonators
			const unitKeys = Object.keys(units);
			const blastWatch = { watchUnits: [], watchDets: [] };

			if (unitKeys.length > 0) {
				for (const unitKey of unitKeys) {
					if (
						units[unitKey].data.keySwitchStatus === 1 &&
						units[unitKey].units.unitsCount > 0
					) {
						snapShotObj.blastUnits[unitKey] = units[unitKey];
						blastWatch.watchUnits.push(unitKey);

						const childKeys = Object.keys(units[unitKey].children);
						blastWatch.watchDets = [...blastWatch.watchDets, ...childKeys];
					} else if (
						units[unitKey].data.keySwitchStatus === 0 &&
						units[unitKey].units.unitsCount > 0
					) {
						snapShotObj.excludedUnits[unitKey] = units[unitKey];
					} else {
						snapShotObj.disarmedUnits[unitKey] = units[unitKey];
					}
				}
				return { snapShotObj, blastWatch };
			} else {
				console.log("no units found");
				return null;
			}
		} catch (err) {
			console.log(err);
		}
	}

	setState(state) {
		this.emitter.emit(state);
		this.data.state = state;
	}

	setFiringTimer(duration) {
		this.timer = setTimeout(() => {
			this.data.firingComplete = Date.now();
			this.setState("BLAST_FIRING");
		}, duration);
	}

	addLog(logs) {
		if (!Array.isArray(logs.value)) {
			logs.value = [logs.value];
		}

		this.data.logs.push(logs.value);

		for (const log of logs.value) {
			//check to the fireButton off to complete firing part
			if (
				log.typeId === 0 &&
				log.changes.hasOwnProperty("fireButton") &&
				log.changes.fireButton === 0
			) {
				clearTimeout(this.timer);
				this.data.firingComplete = log.modified;
				this.data.firingTime = this.data.firingComplete - this.data.created;
				this.setState("BLAST_FIRED");
			}

			//check that each unit and det has been returned to end the blast.
			if (log.typeId === 3) {
				//check to see if it is in the list
				const checkBlastUnit = this.blastWatch.watchUnits.findIndex(
					x => x === log.serial.toString()
				);

				if (checkBlastUnit !== -1) {
					this.blastWatch.watchUnits.splice(checkBlastUnit, 1);
				}
			}

			if (log.typeId === 4) {
				//check to see if it is in the list
				const checkDetUnit = this.blastWatch.watchDets.findIndex(
					x => x === log.windowId.toString()
				);

				if (checkDetUnit !== -1) {
					this.blastWatch.watchDets.splice(checkDetUnit, 1);
				}
			}

			if (
				this.blastWatch.watchDets.length === 0 &&
				this.blastWatch.watchUnits.length === 0 &&
				this.data.state !== "BLAST_DATA_COMPLETE"
			) {
				this.data.blastClosed = log.modified;
				this.data.blastReturnTime =
					this.data.blastClosed - this.data.firingComplete;
				this.setState("BLAST_DATA_COMPLETE");
			}
		}
	}

	endBlast(snapshot) {
		this.data.snapshots.end = this.createSnapshot(snapshot).snapShotObj;
	}
}

module.exports = BlastModel;
