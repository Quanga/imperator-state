function ServerService() {}

ServerService.prototype.initialise = function($happn) {
	const HappnerClient = require("happner-client");
	const { error: logError, info: logInfo, warn: logWarn } = $happn.log;
	const { queueService } = $happn.exchange;
	const { replicationEnabled, port, endpoint } = $happn.config;

	let initialiseAsync = async () => {
		if (replicationEnabled === "true") {
			this.hapClient = new HappnerClient({
				//requestTimeout: 10 * 1000,
				//responseTimeout: 20 * 1000
			});

			let options = [
				{
					host: endpoint,
					port: port
				}
			];

			//temporary, move to env
			let credentials = {
				protocol: "http",
				username: "_ADMIN",
				password: "happn"
			};

			let messageApi = {
				messageHandler: {
					version: "^0.0.1",
					methods: {
						MessageReceiveHandler: {}
					}
				}
			};

			this.hapClient
				.connect(
					options,
					credentials
				)
				.then(() => {
					this.apiModel = this.hapClient.construct(messageApi);
					queueService.watchEndpointQueue();
				})
				.catch(err => {
					logError("connection to Server error", err);
				});

			this.hapClient.on("connected", () => {
				logInfo("connected of SERVER");
			});

			this.hapClient.on("error", e => {
				logError("connection to Server error", e);
			});
			this.hapClient.on("disconnected", () => {
				logWarn("disconnected from SERVER");
			});
		}
	};

	return initialiseAsync();
};

ServerService.prototype.sendMessage = function($happn, message) {
	const { error: logError, info: logInfo } = $happn.log;

	let serverApiAsync = async () => {
		try {
			await this.apiModel.exchange.messageHandler.MessageReceiveHandler(
				message,
				null
			);
			logInfo("Message successfully sent to server");
		} catch (err) {
			logError("Error sending message to server", err);
		}
	};
	return serverApiAsync();
};

module.exports = ServerService;
