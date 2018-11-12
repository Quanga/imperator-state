describe("serial-port-service-test", function() {
	const SerialPortService = require("../../lib/services/serial_port_service");
	let serialPortService = null;

	const MockHappn = require("../mocks/mock_happn");
	let mockHappn = null;

	this.timeout(30000);

	before("it sets up the dependencies", function(callback) {
		serialPortService = new SerialPortService();
		mockHappn = new MockHappn();
		callback();
	});

	it("successfully initialises the serial port service", function() {
		serialPortService.initialise(mockHappn);
	});
});
