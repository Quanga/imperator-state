require("dotenv").config({ path: "../../../.env" });

const Happner = require("happner-2");

const config = require("../../../config");
const assert = require("assert");
const expect = require("expect.js");

describe("App Startup Tests", async function() {
	let meshInstance;
	this.timeout(30000);

	const timeOut = timer => {
		return new Promise(resolve => {
			setTimeout(() => {
				resolve();
			}, timer);
		});
	};

	beforeEach("start the server", async function() {
		let mesh = new Happner();
		await timeOut(1000);

		meshInstance = await mesh.initialize(config);
		meshInstance.exchange.app.startApp();
		await timeOut(1000);
	});

	afterEach(async function() {
		meshInstance.stop({ reconnect: false });
		await timeOut(2000);
	});
	after("kill", async function() {
		meshInstance.stop({ kill: true, reconnect: false });
	});

	it("can get the data at the startup on first time", async function() {
		await meshInstance.exchange.app.resetApp();
		await meshInstance.stop({ reconnect: false });
		await meshInstance.initialize(config);
		await meshInstance.exchange.app.startApp();

		//await meshInstance.start();
		let info = await meshInstance.exchange.app.getAppInfo();

		//assert(info.status, "STOPPED");
		expect(info.name).to.eql("");
	});

	it("can get the data at the startup with statup incomplete", async function() {
		let info = await meshInstance.exchange.app.getAppInfo();

		console.log(info);
		//assert(info.status, "STOPPED");
		assert(!info.name);
	});

	it("can set the data at the startup", async function() {
		let info = await meshInstance.exchange.app.getAppInfo();

		await meshInstance.exchange.app.setAppInfo(
			{
				...info,
				setupComplete: true
			},
			"persist"
		);

		let result = await meshInstance.exchange.app.getPersistedAppInfo();

		console.log(result);
		expect(result.setupComplete).to.eql(true);
	});

	it("can subscrive to the data updates in the app on the data component", async function() {
		let events = [];
		meshInstance.event.data.on(
			"*",
			function(data) {
				events.push(data);
			},
			// eslint-disable-next-line no-unused-vars
			function(error, _eventRef) {
				if (error) {
					throw new Error(error);
				}
			}
		);

		let info = await meshInstance.exchange.app.getAppInfo();

		await meshInstance.exchange.app.setAppInfo(
			{
				...info,
				setupComplete: true
			},
			"persist"
		);

		await timeOut(100);
		expect(events.length).to.eql(1);
		expect(events[0].setupComplete).to.eql(true);

		await meshInstance.exchange.app.setAppInfo(
			{
				...info,
				setupComplete: false
			},
			"persist"
		);
		await timeOut(100);

		expect(events.length).to.eql(2);
		expect(events[1].setupComplete).to.eql(false);

		await timeOut(2000);
	});

	it("can subscrive to the data updates  on the data component with SET", async function() {
		let info = await meshInstance.exchange.app.getAppInfo();

		let events = [];
		meshInstance.event.data.on(
			"*",
			{
				event_type: "set",
				initialCallback: true
			},
			function(data, meta) {
				events.push({ data: data, meta: meta });
			},
			function(error, _eventRef) {
				if (error) {
					throw new Error("cannot connect,", _eventRef);
				}
			}
		);

		await meshInstance.exchange.app.setAppInfo(
			{
				...info,
				setupComplete: true
			},
			"persist"
		);

		await timeOut(100);
		expect(events.length).to.eql(1);
		//console.log(events);
		expect(events[0].data.setupComplete).to.eql(true);

		await meshInstance.exchange.app.setAppInfo(
			{
				...info,
				setupComplete: false
			},
			"persist"
		);
		await timeOut(100);

		expect(events.length).to.eql(2);
		expect(events[1].data.setupComplete).to.eql(false);

		await timeOut(2000);
	});
});
