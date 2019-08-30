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

		it("can stop the queueService - happn");

		it("can queue an incoming packet and will resolve null if there is an error", async () => {
			const messageObj = {
				packet: "987139872391827398",
				createdAt: Date.now()
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

		it("will return false if there is no created or id an incorrect format is supplied", async () => {
			const msgObj = {
				packet: "987139872391827398"
			};
			const warnSpy = sandbox.spy(mock.log, "warn");

			await expect(queueService.processIncoming(mock, msgObj)).to.eventually.be.fulfilled.with
				.false;

			expect(warnSpy).to.have.been.calledOnceWith(
				`Queue error: Packet ${msgObj} has and invalid date format`
			);
			warnSpy.resetHistory();

			const msgObj2 = {
				packet: "987139872391827398",
				createdAt: 132123131212321312
			};

			await expect(queueService.processIncoming(mock, msgObj2)).to.eventually.be.fulfilled.with
				.false;

			expect(warnSpy).to.have.been.calledOnceWith(
				`Queue error: Packet ${msgObj} has and invalid date format`
			);
		});
	});
});
