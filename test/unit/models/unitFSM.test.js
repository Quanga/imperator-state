/* eslint-disable no-unused-vars */
const chai = require("chai");
const expect = chai.expect;
chai.use(require("chai-match"));
const sinon = require("sinon");
const sinonChai = require("sinon-chai");
const chaiPromise = require("chai-as-promised");

chai.use(sinonChai);
chai.use(chaiPromise);

const utils = require("../../helpers/utils");
const fields = require("../../../lib/configs/fields/fieldConstants");
const { keySwitchStatus, fireButton } = fields;

const sandbox = sinon.createSandbox();

const UnitFSM = require("../../../lib/models/units/unitFSM");
const unitsFSMs = require("../../../lib/configs/units/fsm");
const unitsSchemas = require("../../../lib/configs/units/unitSchema");

describe("UNIT - Models", async function() {
	this.timeout(10000);
	context("unit FSM model", async () => {
		afterEach(() => {
			sandbox.restore();
		});
		it("can create a new FSM model", async () => {
			const unitFSM = UnitFSM.create();

			expect(unitFSM).to.be.instanceOf(UnitFSM);
		});

		it("can create a new FSM model with a FSM injected", async () => {
			const unitFSM = UnitFSM.create().withFSM(unitsFSMs[0]);

			expect(unitFSM).to.be.instanceOf(UnitFSM);
			expect(unitFSM.fsm).to.be.exist;
		});

		it("can create a new FSM model with a FSM injected and triggers for type 0", async () => {
			const unitFSM = UnitFSM.create()
				.withTriggers(unitsSchemas[0].fsm)
				.withFSM(unitsFSMs[0])
				.start();

			expect(unitFSM).to.be.instanceOf(UnitFSM);
			expect(unitFSM.fsm).to.exist;
			expect(unitFSM.triggers).to.exist;
		});

		it("can create a new FSM model with a FSM injected and triggers for type 3", async () => {
			const callSpy = sandbox.spy();

			const unitFSM = UnitFSM.create()
				.withTriggers(unitsSchemas[3].fsm)
				.withFSM(unitsFSMs[3])
				.on("state", state => {
					console.log(state);
					callSpy(state);
				})
				.start();

			expect(unitFSM).to.be.instanceOf(UnitFSM);
			expect(unitFSM.fsm).to.exist;
			expect(unitFSM.triggers).to.exist;
			await utils.timer(6000);
		});

		it("can create toggel to ARMED state with type 0", async () => {
			const callSpy = sandbox.spy();
			const unitFSM = UnitFSM.create()
				.withTriggers(unitsSchemas[0].fsm)
				.withFSM(unitsFSMs[0])
				.on("state", state => {
					console.log(state);
					callSpy(state);
				})
				.start();

			const prev = { [keySwitchStatus]: 0, [fireButton]: 0 };
			const next = { [keySwitchStatus]: 1, [fireButton]: 0 };

			unitFSM.toggleState(prev, next);

			await utils.timer(200);

			expect(callSpy).to.have.been.calledOnce;
		});

		it("can create toggel to KEY SWITCH state with type 0", async () => {
			const callSpy = sandbox.spy();
			const unitFSM = UnitFSM.create()
				.withTriggers(unitsSchemas[0].fsm)
				.withFSM(unitsFSMs[0])
				.start();

			unitFSM.on("state", state => {
				console.log(state);
				callSpy(state);
			});

			const prev = { [keySwitchStatus]: 0, [fireButton]: 0 };
			const next = { [keySwitchStatus]: 1, [fireButton]: 0 };

			unitFSM.toggleState(prev, next);

			await utils.timer(500);

			expect(callSpy).to.have.been.calledOnce;
		});

		it("can create toggel to ARMED state with type 3", async () => {
			const callSpy = sandbox.spy();
			const unitFSM = UnitFSM.create()
				.withTriggers(unitsSchemas[3].fsm)
				.withFSM(unitsFSMs[3])
				.start();

			unitFSM.on("state", state => {
				console.log(state);
				callSpy(state);
			});

			let prev = { [keySwitchStatus]: 0 };
			let next = { [keySwitchStatus]: 1 };

			unitFSM.toggleState(prev, next);
			await utils.timer(500);

			expect(callSpy.getCall(0).args[0]).to.be.deep.equal({
				active: { operation: "armed", faults: "none" },
			});
			prev = { [keySwitchStatus]: 1 };
			next = { [keySwitchStatus]: 0 };
			unitFSM.toggleState(prev, next);
			await utils.timer(500);

			expect(callSpy).to.have.been.calledTwice;
		});

		it("can create timeout with type 3", async () => {
			const callSpy = sandbox.spy();
			const fsmRecipe = unitsFSMs[3];
			fsmRecipe[1] = {
				delays: {
					COMM_INACTIVE: (context, event) => {
						return 3000;
					},
				},
			};

			const unitFSM = UnitFSM.create()
				.withTriggers(unitsSchemas[3].fsm)
				.withFSM(fsmRecipe)
				.on("state", state => {
					console.log(state);
					callSpy(state);
				})
				.start();

			//console.log(unitFSM.getState());

			await utils.timer(4000);

			//expect(callSpy.getCall(0).args[0]).to.be.deep.equal("inactive");

			await utils.timer(3000);

			const prev = { [keySwitchStatus]: 0 };
			const next = { [keySwitchStatus]: 1 };
			unitFSM.toggleState(prev, next);

			await utils.timer(500);

			expect(callSpy).to.have.been.calledThrice;
		});

		it("can create toggel to ERROR_FIRE state type 0", async () => {
			const callSpy = sandbox.spy();
			const initialState = { [keySwitchStatus]: 1, [fireButton]: 1 };

			const unitFSM = UnitFSM.create()
				.withTriggers(unitsSchemas[0].fsm)
				.withFSM(unitsFSMs[0])
				.start()
				.withState(initialState);

			unitFSM.on("state", state => {
				console.log(state);
				callSpy(state);
			});

			const prev = { [keySwitchStatus]: 1, [fireButton]: 1 };
			const next = { [keySwitchStatus]: 0, [fireButton]: 1 };

			unitFSM.toggleState(prev, next);

			await utils.timer(2000);

			expect(callSpy).to.have.been.calledTwice;
		});

		it("can create change to a single state", async () => {
			const callSpy = sandbox.spy();
			const unitFSM = UnitFSM.create()
				.withTriggers(unitsSchemas[0].fsm)
				.withFSM(unitsFSMs[0])
				.on("state", state => {
					console.log(state);
					callSpy(state);
				})
				.start();

			const prev = { [keySwitchStatus]: 0, [fireButton]: 0 };
			const next = { [keySwitchStatus]: 0, [fireButton]: 1 };

			unitFSM.toggleState(prev, next);

			utils.timer(2000);

			expect(callSpy).to.have.been.calledOnce;
		});
	});
});
