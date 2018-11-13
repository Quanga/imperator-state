function ServerService() {
	this.__connected = false;
}

ServerService.prototype.initialise = function($happn) {
	const HappnerClient = require("happner-client");
	const { error: logError, info: logInfo, warn: logWarn } = $happn.log;
	const { queueService } = $happn.exchange;
	const { replicationEnabled, port, endpoint } = $happn.config;

	let initialiseAsync = async () => {
		try {
			if (replicationEnabled === "true") {
				this.hapClient = new HappnerClient({
					requestTimeout: 10 * 1000,
					responseTimeout: 20 * 1000
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
					password: "happn",
					info: "redundant_ordered", //info is appended to each connection
					//poolType: happn.constants.CONNECTION_POOL_TYPE.ORDERED, //default is 0 RANDOM
					poolReconnectAttempts: 0 //how many switches to perform until a connection is made
					// socket: {
					// 	reconnect: {
					// 		retries: 1, //one retry
					// 		timeout: 100
					// 	}
					// }
				};

				let messageApi = {
					messageHandler: {
						version: "^0.0.1",
						methods: {
							MessageReceiveHandler: {}
						}
					}
				};

				let interval = setInterval(() => {
					this.hapClient
						.connect(
							options,
							credentials
						)
						.then(() => {
							this.apiModel = this.hapClient.construct(messageApi);
						})
						// eslint-disable-next-line no-unused-vars
						.catch(err => {
							logWarn("connection to Server error");
						});
				}, 10000);

				this.hapClient.on("connected", () => {
					logInfo("connected to SERVER");
					clearInterval(interval);
					queueService.watchEndpointQueue(true);
				});

				// eslint-disable-next-line no-unused-vars
				this.hapClient.on("error", e => {
					this.__connected = true;
					logError("connection to Server error");
					queueService.watchEndpointQueue(false);
				});

				this.hapClient.on("disconnected", () => {
					this.__connected = false;
					logWarn("disconnected from SERVER");
					queueService.watchEndpointQueue(false);
				});

				this.hapClient.on("reconnected", () => {
					this.__connected = true;
					queueService.watchEndpointQueue(true);

					console.log("reconnected");
				});

				this.hapClient.on("reconnecting", async () => {
					this.__connected = false;
					await queueService.watchEndpointQueue(false);

					console.log("reconnecting");

					// event fired when attempting to reconnect
				});
			}
		} catch (err) {
			console.log("err");
		}
	};

	return initialiseAsync();
};

ServerService.prototype.sendMessage = function($happn, message) {
	const { error: logError, info: logInfo } = $happn.log;

	let serverApiAsync = async () => {
		try {
			if (this.__connected === true) {
				await this.apiModel.exchange.messageHandler.MessageReceiveHandler(
					message,
					null
				);
				logInfo("Message successfully sent to server");
			}
		} catch (err) {
			logError("Error sending message to server", err);
		}
	};
	return serverApiAsync();
};

module.exports = ServerService;
