/* eslint-disable require-atomic-updates */
// eslint-disable-next-line no-unused-vars
const chai = require("chai");
const expect = chai.expect;
chai.use(require("chai-match"));
const asPromised = require("chai-as-promised");
chai.use(asPromised);
const sinon = require("sinon");
const sinonChai = require("sinon-chai");
const sandbox = sinon.createSandbox();

chai.use(sinonChai);

describe("UNIT - Components", async function() {
	const QueueService = require("../../../lib/services/queue_service");
	const queueService = new QueueService();
	const Mock = require("../../mocks/mock_happn");
	const mock = new Mock();
	mock.name = "queueService";

	beforeEach(() => {
		sandbox.restore();
	});

	context("Queue Service", async () => {
		it("can start the queueService - happn", async () => {
			await expect(queueService.componentStart(mock)).to.eventually.be.fulfilled;
		});

		it("can queue an incoming packet and will resolve null if there is an error", async () => {
			const messageObj = {
				packet:
					"aaaa4805004d300029291001cc291101fe291201172a13011c2a1401302a1501492a16014e2a1701622a1801942a1901ad2a1a01b72a1b01df2a1c01f82a1d0100001e016400c98e",
				createdAt: Date.now(),
			};
			let packetSpy = sandbox.stub(mock.exchange.packetService, "extractData").resolves(null);
			await expect(queueService.processIncoming(mock, messageObj)).to.eventually.be.fulfilled.with
				.false;
			expect(packetSpy).to.have.been.calledOnce;

			packetSpy.resolves([{ item: "test" }]);

			let dataServiceStub = sandbox
				.stub(mock.exchange.dataService, "upsertNodeDataArr")
				.resolves(true);

			await expect(queueService.processIncoming(mock, messageObj)).to.eventually.be.fulfilled.with
				.true;

			expect(packetSpy).to.have.been.calledTwice;
			expect(dataServiceStub).to.have.been.calledOnce;
		});

		it("packet validation will fail if incorrect format is provided", async () => {
			let msgObj = {
				packet: "aaaa1c0400431b43e93c611b43e93d621b43e93e631b43e93f6414ac",
			};

			await expect(queueService.validatePacket(mock, msgObj)).to.eventually.be.rejected.then(value => {
				expect(value.message).to.be.equal(`Packet ${msgObj} is missing Date property`);
			});

			msgObj = {
				createdAt: null,
			};

			await expect(queueService.validatePacket(mock, msgObj)).to.eventually.be.rejected.then(value => {
				expect(value.message).to.be.equal(`Packet ${msgObj} is missing Packet property`);
			});

			msgObj = {
				packet: "aaaa1c0400431b43e93c611b43e93d621b43e93e631b43e93f6414ac",
				createdAt: null,
			};

			await expect(queueService.validatePacket(mock, msgObj)).to.eventually.be.rejected.then(value => {
				expect(value.message).to.be.equal(`Packet ${msgObj} has and invalid date format`);
			});
		});
	});
});
