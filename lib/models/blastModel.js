const uuidv1 = require("uuid/v1");
const EventEmitter = require("events");

class BlastModel extends EventEmitter {
	constructor(created) {
		super();
		//create a unique ID for the blast ID
		this.blastId = uuidv1();
		this._fireTime = 2000;

		this.blastState = {
			blastCreated: created,
			blastFired: null,
			blastClosed: null
		};

		this.systemState = {
			firingState: null,
			armedState: null,
			faultState: null
		};

		//all the nodes allocated to this blast
		this.blastNodes = [];
		this.blastNodesHistory = [];
	}

	async addToBlast(unit) {
		try {
			let check = this.blastNodes.find(
				elem =>
					unit.data.serial === elem.data.serial &&
					unit.data.type_id === elem.data.type_id
			);

			await this.snapShotEdds(unit, "start");
			//snapshot on add
			unit.state.snapshots.start = JSON.parse(JSON.stringify(unit.data));
			unit.state.blastEventState = "ACTIVE";

			if (!check) {
				this.blastNodes.push(unit);
			}
		} catch (err) {
			return Promise.reject(err);
		}
	}

	async removeFromBlast(unit) {
		try {
			console.log("DELETING IN UNIT");

			let check = this.blastNodes.find(
				elem =>
					unit.data.serial === elem.data.serial &&
					unit.data.type_id === elem.data.type_id
			);

			unit.state.blastEventState = "INACTIVE";
			await this.snapShotEdds(unit, "end");

			let historyObj = {
				serial: unit.data.serial,
				type_id: unit.data.type_id,
				state: JSON.parse(JSON.stringify(unit.state))
			};

			//clear the snapshots and events
			unit.state.events = [];
			unit.state.snapshots = [];

			let index = this.blastNodes.indexOf(unit);

			if (check) {
				this.blastNodesHistory.push(historyObj);
				this.blastNodes.splice(index, 1);
			}

			//check if items are removed from the blastNodes, if so close the blast
			if (this.blastNodes.length === 0) {
				this.blastState.blastClosed = unit.data.modified;
				//emit that this one is closed so the event service can archive it
				this.emit("blastClosed", this);
			}
		} catch (err) {
			return Promise.reject(err);
		}
	}

	async snapShotEdds(unit, position) {
		//snapshot on remove

		try {
			unit.state.snapshots.end = JSON.parse(JSON.stringify(unit.data));

			if (unit.hasOwnProperty("childUnits")) {
				let snapData = unit.childUnits.map(x => {
					return x.data;
				});

				let snapshotDetsEnd = {
					[position]: snapData
				};
				unit.state.edds.push(snapshotDetsEnd);
			}
		} catch (err) {
			return Promise.reject(err);
		}
	}

	//METHODS
	initiateBlast(timeFired) {
		this.blastState.blastFired = timeFired;
		this.systemState.firingState = "FIRING";
		setTimeout(() => {
			this.systemState.firingState = "FIRED";
		}, this._fireTime);
	}

	completeBlast(timeComplete) {
		this.blastClosed = timeComplete;
		//do something with the data before disposing this object
	}
}

module.exports = BlastModel;
