

describe("Queue Service Tests", function () {

	//var assert = require("assert");
	const QueueService = require("../../../lib/services/queue_service");
	const queueService = new QueueService();

	const MockHappn = require("../../mocks/mock_happn");
	const mockHappn = new MockHappn();

	this.timeout(10000);


	after("clean up", function (callback) {
		queueService.stop(mockHappn, function (err) {
			callback(err);
		});
	});

	it("successfully initialises the file queue service", async function () {
		try {
			await queueService.initialise(mockHappn);
		} catch (error) {
			return Promise.reject(error);
		}
	});

	it("successfully starts watching the file queue", function () {
		queueService.initialise(mockHappn);
	});

	it("successfully adds an item to the file queue", function () {
		let mockMessage = "My mock message";
		queueService.addToIncomingQueue(mockHappn, mockMessage);
	});





});