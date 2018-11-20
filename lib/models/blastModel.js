const uuidv1 = require("uuid/v1");

class BlastModel {
	constructor(created) {
		//create a unique ID for the blast ID
		this.blastID = uuidv1();

		this.blastCreated = created;
		this.blastFired = null;
		this.blastClosed = null;

		//all the nodes allocated to this blast
		this.blastNodes = {};
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
