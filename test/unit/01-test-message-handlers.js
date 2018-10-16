/**
 * Created by grant on 2016/07/20.
 */

describe("serial-port-service-test", function() {
	const MessageHandler = require("../../lib/handlers/message_handlers");
	let messageHandler = null;

	const MockHappn = require("../mocks/mock_happn");
	let mockHappn = null;

	this.timeout(10000);

	before("it sets up the dependencies", function(callback) {
		messageHandler = new MessageHandler();
		mockHappn = new MockHappn();
		callback();
	});
});
