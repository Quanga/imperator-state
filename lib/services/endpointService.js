/* eslint-disable max-len */
/* eslint-disable no-unused-vars */
const tcpPortUsed = require("tcp-port-used");
const Mesh = require("happner-2");
var Queue = require("better-queue");
const moment = require("moment");

function EndpointService() {
	this.client = null;
	this.check;
	this.status = "DISCONNECTED";
}

const START_MESSAGE = "Starting Endpoint Service..........";

EndpointService.prototype.start = function($happn) {
	const { endpointService } = $happn.exchange;
	const { log } = $happn;

	return (async () => {
		try {
			log.info(START_MESSAGE);
			endpointService.createIncomingQueue();
			await endpointService.checkForEndpoint();
			return true;
		} catch (err) {
			log.error("Error connecting to endpoint", err);
			return false;
		}
	})();
};

EndpointService.prototype.componentStop = function($happn) {
	const { log } = $happn;
	const { env } = $happn.config;

	return new Promise(resolve => {
		if (this.check) {
			clearInterval(this.check);
		}

		if (this.client && this.status === "CONNECTED") {
			const { queueService: evQueueService } = this.client.event[env.endpointName];

			evQueueService.off(this._epRef, err => {
				if (err) log.error(err);
			});

			this.client.off("login/allow", err => {
				if (err) log.error(err);
			});

			this.client.off("login/deny", err => {
				if (err) log.error(err);
			});

			this.client.off("login/error", err => {
				if (err) log.error(err);
			});

			this.client.disconnect(err => {
				if (err) {
					log.error(err);
					return resolve(err);
				}

				log.info("Endpoint Disconnected");
				resolve();
			});
		}
		resolve();
	});
};

EndpointService.prototype.checkForEndpoint = function($happn) {
	const { endpointService } = $happn.exchange;
	const { log } = $happn;
	const { env } = $happn.config;

	return (async () => {
		try {
			this.check = setInterval(() => {
				log.info(
					`Checking for Endpoint ${env.endpointName} - ${env.endpointIP}:${env.endpointPort}`
				);
				console.log(env);

				tcpPortUsed.waitUntilUsedOnHost(env.endpointPort, env.endpointIP, 500, 2000).then(
					() => {
						clearInterval(this.check);
						clearTimeout(this.checkTimer);
						log.info(`Connecting to Endpoint ${env.endpointName}`);
						endpointService.connectToEndpoint();
					},
					err => {
						throw new Error(`${env.endpointIP}:${env.endpointPort} not available`);
					}
				);
			}, env.endpointCheckInterval);

			//will stop checking after 2 minutes
			this.checkTimer = setTimeout(() => {
				clearInterval(this.check);
			}, 60000);
		} catch (err) {
			console.log(err);
		}
	})();
};

EndpointService.prototype.createIncomingQueue = function($happn) {
	const { queueService } = $happn.exchange;
	const { log } = $happn;

	this.incomingQueue = new Queue((input, cb) => {
		queueService.processIncoming(input).then((err, res) => {
			if (err) {
				log.error("cannot process queue", err);
				cb(err);
			}
			cb(null, res);
		});
	});

	this.incomingQueue.on("task_failed", (taskId, errorMessage) => {
		log.error("Endpoint queue task failed", taskId, errorMessage);
	});
};

EndpointService.prototype.connectToEndpoint = function($happn) {
	const { endpointService } = $happn.exchange;
	const { env } = $happn.config;
	const { log } = $happn;

	log.info("Connecting to endpoint.......");

	this.client = new Mesh.MeshClient({
		secure: true,
		host: env.endpointIP,
		port: env.endpointPort
	});

	return new Promise((resolve, reject) => {
		this.client.on("login/allow", () => {
			log.info(`Connected to Endpoint ${env.endpointName} as ${env.endpointUsername}`);
			this.status = "CONNECTED";
			endpointService.initialise();
			resolve();
		});

		this.client.on("login/deny", err => {
			log.error("Access Denied", err);
			this.status = "DISCONNECTED";

			reject(err);
		});

		this.client.on("login/error", err => {
			log.error("Login Error", err);
			this.status = "DISCONNECTED";

			reject(err);
		});

		this.client.on("reconnect/scheduled", () => {
			// client is attempting reconnect after lost connection
			this.status = "DISCONNECTED";

			log.info("Endpoint disconnected......reconnecting");
			log.info("need to add in aspects here");
		});

		this.client.on("reconnect/successful", () => {
			this.status = "CONNECTED";

			log.info("Endpoint reconnected");
			endpointService.initialise();
		});

		this.client.login({
			username: env.endpointUsername,
			password: env.endpointPassword
		});
	});
};

EndpointService.prototype.initialise = function($happn) {
	const { stateService, nodeRepository, endpointService } = $happn.exchange;
	const { log, name } = $happn;
	const { env } = $happn.config;

	return (async () => {
		try {
			const { queueService: evQueueService } = this.client.event[env.endpointName];
			const { queueService: epQueueService } = this.client.exchange[env.endpointName];

			let activeQueues = await epQueueService.getActiveQueues();

			if (activeQueues.findIndex(queue => queue === env.endpointUsername) === -1) {
				let lastPacket = await nodeRepository.getLastPacketTime();
				log.info(
					`Last known packet received ${moment(lastPacket).format("'MMMM Do YYYY, h:mm:ss a'")}`
				);

				log.info(
					`Creating queue for ${env.endpointUsername} with last know packet ${lastPacket || 0}`
				);

				await epQueueService.buildQueue(env.endpointUsername, lastPacket || 0);
			}

			log.info(`Connecting to queue - ${env.endpointName} - ${env.endpointUsername}`);

			const queueCount = await epQueueService.size(env.endpointUsername);
			log.info(`Downloading ${queueCount} items from queue`);

			await endpointService.checkQueue();

			log.info(`Listening to queue - ${env.endpointName}-${env.endpointUsername}`);

			evQueueService.on(
				`enqueue/${env.endpointUsername}`,
				data => {
					endpointService.checkQueue();
				},
				(err, _eventRef) => {
					if (err) {
						return log.error("Failed to subscribe to queue endpoint", err);
					}
					this._epRef = _eventRef;
				}
			);

			stateService.updateState({ service: name, state: "STARTED" });
			log.info(`Initializing Queue Service..............PASSED`);
		} catch (err) {
			stateService.updateState({ service: name, state: "FAILED" });
			log.info(`Initializing Queue Service..............FAILED - ${err}`);
			return Promise.reject(err);
		}
	})();
};

EndpointService.prototype.checkQueue = function($happn) {
	const { env } = $happn.config;
	const { queueService: epQueueService } = this.client.exchange[env.endpointName];
	const { log } = $happn;

	return (async () => {
		try {
			if (this.status === "CONNECTED") {
				let queueCount = await epQueueService.size(env.endpointUsername);

				for (let i = 0; i < queueCount; i++) {
					let packet = await epQueueService.dequeue(env.endpointUsername);
					if (packet) {
						this.incomingQueue.push(packet);
					} else {
						log.error("Break in queue service........");
						break;
					}
				}
			}
		} catch (err) {
			log.error("Error checking queue ", err);
		}
	})();
};

module.exports = EndpointService;
