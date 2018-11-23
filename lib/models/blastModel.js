const uuidv1 = require("uuid/v1");
const EventEmitter = require("events");

class BlastModel extends EventEmitter {
	constructor(created) {
		super();
		//create a unique ID for the blast ID
		this.blastID = uuidv1();

		this.blastCreated = created;
		this.blastFired = null;
		this.blastClosed = null;

		//all the nodes allocated to this blast
		this.blastNodes = [];
	}

	initialise(controlUnit) {
		controlUnit.on("Armed", () => {
			this.emit("CU_Armed", controlUnit);
		});

		this.blastNodes.push(controlUnit);
		console.log(this);
	}

	addToBlast(unit, options) {
		//check if already exists
		let check = this.blastNodes.find(
			elem =>
				unit.data.serial === elem.data.serial &&
				unit.data.type_id === elem.data.type_id
		);

		//console.log("CHECK RETURN", check);
		if (!check) {
			//add an event listner to this unit for its changes
			if (options !== undefined) {
				unit.meta.blastStatus = options.status;
			}
			this.blastNodes.push(unit);
			//console.log("adding unit", unit);
		}
	}

	//METHODS
	fireBlast(timeFired) {
		this.blastFired = timeFired;
	}

	completeBlast(timeComplete) {
		this.blastClosed = timeComplete;
		//do something with the data before disposing this object
	}
}

module.exports = BlastModel;
