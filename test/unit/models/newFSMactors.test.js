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

const sandbox = sinon.createSandbox();

describe("FSM", async function() {
	this.timeout(10000);
	context("actor FSM tests", async () => {
		afterEach(() => {
			sandbox.restore();
		});

		it("can create a new FSM model", async () => {
			const { Machine, assign, spawn, interpret } = require("xstate");

			const testMachine = Machine({
				id: "tester",
				initial: "disarmed",
				context: {
					keyOn: 0,
				},
				states: {
					disarmed: {},
					armed: {},
				},
				on: {
					ARMED: { target: "armed" },
					DISARMED: { target: "armed" },
				},
			});

			const testMain = Machine({
				id: "main",
				context: {
					keyOn: 0,
					stored: [{ keyOn: 0 }, { keyOn: 0 }],
				},
				initial: "initializing",
				states: {
					initializing: {
						entry: assign({
							children: (ctx, e) => {
								return ctx.stored.reduce((acc, cont, i) => {
									acc[`child-${i}`] = spawn(testMachine.withContext(cont), { sync: true });
									return acc;
								}, {});
							},
						}),
						on: {
							"": "active",
						},
					},
					all: {},
					active: {},
					completed: {},
				},
				on: {
					ADD: {
						actions: assign({
							todos: (context, event) => [
								...context.todos,
								{
									todo: event.todo,
									// add a new todoMachine actor with a unique name
									ref: spawn(testMachine),
								},
							],
						}),
					},
				},
			});

			const service = interpret(testMain).onTransition(state => {
				const { key } = state.context;
				console.log(
					Object.keys(state.context.children).map(c => state.context.children[c].state.context),
				);

				//console.log(key[0].ref.state.value);
				console.log(state.value);
			});

			// Start the service
			service.start();
			console.log(service.state.value);

			await utils.timer(2000);
			//console.log(testMain);
		});
	});
});
