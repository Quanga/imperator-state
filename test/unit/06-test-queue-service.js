/**
 * Created by grant on 2016/07/19.
 */


describe("queue-service-test", function () {

	const QueueService = require('../../lib/services/queue_service');
	let queueService = null;

	const MockHappn = require('../mocks/mock_happn');
	let mockHappn = null;

	this.timeout(30000);

	before('it sets up the dependencies', function (callback) {

		queueService = new QueueService();
		mockHappn = new MockHappn();
		callback();
	});

	after('clean up', function (callback) {
		queueService.stop(mockHappn, function (err) {
			callback(err);
		});
	});

	it('successfully initialises the file queue service', function () {

		queueService.initialise(mockHappn);
	});

	it('successfully starts watching the file queue', function () {
		queueService.initialise(mockHappn);
	});

	it('successfully adds an item to the file queue', function () {

		let mockMessage = "My mock message";
		queueService.addToIncomingQueue(mockHappn, mockMessage);
	});

});