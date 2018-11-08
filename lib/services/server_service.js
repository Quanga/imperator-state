function ServerService() {}

ServerService.prototype.initialise = function($happn) {
	let initialiseAsync = async () => {
		const HappnerClient = require("happner-client");
		const { replicationEnabled, endpoint, port } = $happn.config;
		if (replicationEnabled) {
			this.client = new HappnerClient({
				//requestTimeout: 10 * 1000, // (default) milliseconds timeout on api request (set ack)
				//responseTimeout: 20 * 1000, // (default) timeout awaiting response
				//logger: null // (defualt) optional happner-logger
			});

			this.client
				.connect(
					{
						// connection
						host: endpoint,
						port: port
					},
					{
						// options
						//protocol: "https"
						//username: '_ADMIN',
						//password: 'happn',
						//allowSelfSignedCerts: true,
						//info: {}
					}
				)
				.then(() => {
					this.api();
				})
				.catch(err => {
					console.log("CONNECT ERROR", err);
				}); // also supports callback

			//this.login($happn);
		}
	};
	return initialiseAsync();
};

// ServerService.prototype.login = function($happn) {
// 	const credentials = {
// 		username: "username", // pending
// 		password: "password" // pending
// 	};

// 	this.client.login(credentials);

// 	this.client.on("login/allow", () => {
// 		console.log("allowed");
// 		this.api();
// 	});

// 	this.client.on("login/deny", err => {
// 		console.log("err", err);
// 	});

// 	this.client.on("login/error", err => {
// 		console.log("not allowed", err);
// 	});
// };

// eslint-disable-next-line no-unused-vars
ServerService.prototype.serverApi = function($happn) {
	let serverApiAsync = async () => {
		return this.apiModel;
	};
	return serverApiAsync();
};

// eslint-disable-next-line no-unused-vars
ServerService.prototype.api = function($happn) {
	const server = {
		nodeRepository: {
			version: "^1.0.0",
			methods: {
				insertNodeData: {
					// optional parameters for clientside validation
					//params: [{ name: "shelves", type: "array" }]
				}
			}
		}
	};

	//this.apiModel = this.client.exchange.nodeRepository.insertNodeData;
	this.apiModel = this.client.construct(server);
	console.log(":::: apiModel :::::", this.apiModel);
};

module.exports = ServerService;
