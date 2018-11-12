function ServerService() {}

ServerService.prototype.initialise = function($happn) {
	const HappnerClient = require("happner-client");
	const { queueService } = $happn.exchange;
	const { replicationEnabled, port, endpoint } = $happn.config;

	let initialiseAsync = async () => {
		if (replicationEnabled === "true") {
			this.hapClient = new HappnerClient({
				requestTimeout: 10 * 1000,
				responseTimeout: 20 * 1000
			});

			this.hapClient
				.connect(
					[
						{
							host: endpoint,
							port: port
						}
					],
					{
						protocol: "http",
						username: "_ADMIN",
						password: "happn"
					}
				)
				.then(() => {
					const server = {
						messageHandler: {
							version: "^0.0.1",
							methods: {
								MessageReceiveHandler: {}
							}
						}
					};

					this.apiModel = this.hapClient.construct(server);
					queueService.watchEndpointQueue();
				})
				.catch(err => {
					console.log(err);
				});

			this.hapClient.on("connected", () => {
				console.log("CONNECTED");
			});

			this.hapClient.on("error", function(e) {
				console.log("happn connect err ", e);
				// includes model verification mismatches
			});
			this.hapClient.on("disconnected", async () => {
				console.log("disconnected");
			});
		}
	};

	return initialiseAsync();
};

// eslint-disable-next-line no-unused-vars
ServerService.prototype.sendMessage = function($happn, message) {
	let serverApiAsync = async () => {
		await this.apiModel.exchange.messageHandler.MessageReceiveHandler(
			message,
			null
		);
	};
	return serverApiAsync();
};

module.exports = ServerService;
