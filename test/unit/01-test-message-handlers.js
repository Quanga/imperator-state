/**
 * Created by grant on 2016/07/20.
 */



describe("serial-port-service-test", function () {

	var MessageHandler = require('../../lib/handlers/message_handlers');
	var messageHandler = null;

	var MockHappn = require('../mocks/mock_happn');
	var mockHappn = null;

	this.timeout(10000);

	before('it sets up the dependencies', function (callback) {

		messageHandler = new MessageHandler();
		mockHappn = new MockHappn();
		callback();
	});

	it('successfully creates the incoming message handler', function () {

		messageHandler.createMessageReceiveHandler(mockHappn);
	});
});