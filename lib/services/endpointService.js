/* eslint-disable no-unused-vars */
const tcpPortUsed = require("tcp-port-used");
const Mesh = require("happner-2");
const Queue = require("better-queue");
const moment = require("moment");

/**
 * @category Services
 * @module lib/services/EndpointService
 */

/**
 * @class EndpointService
 * @memberof module:lib/services/EndpointService
 */
function EndpointService() {
	this.client = null;
	this.check;
	this.status = "DISCONNECTED";
	this.checking = false;
}

/**
 * @function start
 * @summary Starts the endpoint Peer to Peer Serice
 * @param {$happn} $happn Dependancy Injection of the Happner Framework
 */
EndpointService.prototype.start = function($happn) {
	const { endpointService } = $happn.exchange;
	const { log } = $happn;

	return (async () => {
		try {
			this.eventQueue = new Queue((input, cb) => {
				endpointService.checkQueue().then(val => {
					if (val) {
						return cb();
					}
					log.error("cannot process queue");

					cb("FAILED");
				});
			});

			this.eventQueue.on("task_failed", (taskId, errorMessage) => {
				log.error("Endpoint queue task failed", taskId, errorMessage);
			});

			endpointService.createIncomingQueue();

			if (process.env.DOCKERED !== "true") {
				await endpointService.checkForEndpoint();
			} else {
				endpointService.connectToEndpoint();
			}

			return true;
		} catch (err) {
			log.error("Error connecting to endpoint", err);
			return false;
		}
	})();
};

/**
 * @summary Stops the endpoint Peer to Peer Serice
 * @param {$happn} $happn Dependancy Injection of the Happner Framework
 */
EndpointService.prototype.componentStop = function($happn) {
	const { log } = $happn;

	return new Promise(resolve => {
		if (this.retry) {
			clearTimeout(this.retry);
		}

		if (this.check) {
			clearInterval(this.check);
		}

		if (this.checkTimer) {
			clearTimeout(this.checkTimer);
		}

		if (this.client && this.status === "CONNECTED") {
			const { queueService: evQueueService } = this.client.event[process.env.INPUT_MODULE_NAME];

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

/**
 * @summary Starts the endpoint Peer to Peer Serice
 * @param {$happn} $happn Dependancy Injection of the Happner Framework
 */
EndpointService.prototype.checkForEndpoint = function($happn) {
	const { endpointService } = $happn.exchange;
	const { log } = $happn;

	return (async () => {
		try {
			if (this.retry) clearTimeout(this.retry);

			this.check = setInterval(() => {
				log.info(
					`Checking for Endpoint ${process.env.INPUT_MODULE_NAME} -\
					 ${process.env.INPUT_MODULE_HOST}:${process.env.INPUT_MODULE_PORT}`,
				);

				tcpPortUsed.check(process.env.INPUT_MODULE_PORT, process.env.INPUT_MODULE_HOST).then(
					function(inUse) {
						console.log("Port 44201 usage: " + inUse);
					},
					function(err) {
						console.error("Error on check:", err.message);
					},
				);

				tcpPortUsed
					.waitUntilUsedOnHost(process.env.INPUT_MODULE_PORT, process.env.INPUT_MODULE_HOST, 500, 2000)
					.then(
						() => {
							clearInterval(this.check);
							clearTimeout(this.checkTimer);
							log.info(`Connecting to Endpoint ${process.env.INPUT_MODULE_NAME}`);
							endpointService.connectToEndpoint();
						},
						err => {
							log.warn(`${process.env.INPUT_MODULE_HOST}:${process.env.INPUT_MODULE_PORT} not available`);
						},
					);
			}, process.env.INPUT_MODULE_CHECK_INTERVAL);

			this.checkTimer = setTimeout(() => {
				log.warn("No Endpoint Found......");
				clearInterval(this.check);

				this.retry = setTimeout(() => {
					endpointService.checkForEndpoint();
				}, 60000);
			}, 60000);
		} catch (err) {
			log.error("Endpoint Error:", err);
		}
	})();
};

EndpointService.prototype.createIncomingQueue = function($happn) {
	const { queueService } = $happn.exchange;
	const { log } = $happn;

	this.incomingQueue = new Queue((input, cb) => {
		queueService.processIncoming(input).then(val => {
			if (val) return cb();

			log.error("cannot process queue");
			cb("FAILED");
		});
	});

	this.incomingQueue.on("task_failed", (taskId, errorMessage) => {
		log.error("Endpoint queue task failed", taskId, errorMessage);
	});
};

EndpointService.prototype.connectToEndpoint = function($happn) {
	const { endpointService } = $happn.exchange;
	const { log } = $happn;

	log.info("Connecting to endpoint.......");

	this.client = new Mesh.MeshClient({
		secure: true,
		host: process.env.INPUT_MODULE_HOST,
		port: process.env.INPUT_MODULE_PORT,
	});

	return new Promise((resolve, reject) => {
		const loginInfo = {
			username: process.env.INPUT_MODULE_USER,
			password: process.env.INPUT_MODULE_PASSWORD,
		};

		this.client
			.on("login/allow", () => {
				log.info(
					`Connected to Endpoint ${process.env.INPUT_MODULE_NAME} as ${process.env.INPUT_MODULE_USER}`,
				);
				this.status = "CONNECTED";
				endpointService.initialise();
				resolve();
			})
			.on("login/deny", err => {
				log.error("Access Denied", err);
				this.status = "DISCONNECTED";

				reject(err);
			})
			.on("login/error", err => {
				log.error("Login Error", err);
				this.status = "DISCONNECTED";

				reject(err);
			})
			.on("reconnect/scheduled", () => {
				// client is attempting reconnect after lost connection
				this.status = "DISCONNECTED";
				log.info("Endpoint disconnected......reconnecting");
			})
			.on("reconnect/successful", () => {
				this.status = "CONNECTED";

				log.info("Endpoint reconnected");
				if (this.client.data.status === 0) {
					this.client.login(loginInfo);
				} else {
					endpointService.initialise();
				}
			});

		this.client.login(loginInfo);
	});
};

EndpointService.prototype.initialise = function($happn) {
	const { nodeRepository, endpointService } = $happn.exchange;
	const { log } = $happn;

	return (async () => {
		try {
			const { queueService: evQueueService } = this.client.event[process.env.INPUT_MODULE_NAME];
			const { queueService: epQueueService } = this.client.exchange[process.env.INPUT_MODULE_NAME];

			const activeQueues = await epQueueService.getActiveQueues();

			if (this._epRef) {
				evQueueService.off(this._epRef, error => {
					if (error) return log.error("error removing event", error);

					log.info("Removing current queue event listener");
					this._epRef = undefined;
				});
			}

			if (activeQueues.findIndex(queue => queue === process.env.INPUT_MODULE_USER) === -1) {
				const lastPacket = await nodeRepository.getLastPacketTime();
				const receivedDate = moment(lastPacket).format("'MMMM Do YYYY, h:mm:ss a'");

				log.info(`Last known packet received ${receivedDate}`);

				log.info(
					`Creating queue for ${process.env.INPUT_MODULE_USER} \
					with last packet ${lastPacket || 0}`,
				);

				await epQueueService.buildQueue(process.env.INPUT_MODULE_USER, lastPacket || 0);
			}

			log.info(
				`Connecting to queue -\
				 ${process.env.INPUT_MODULE_NAME} - ${process.env.INPUT_MODULE_USER}`,
			);

			const queueCount = await epQueueService.size(process.env.INPUT_MODULE_USER);
			log.info(`Downloading ${queueCount} items from queue`);

			await endpointService.checkQueue();

			log.info(
				`Listening to queue - ${process.env.INPUT_MODULE_NAME}-${process.env.INPUT_MODULE_USER}`,
			);

			if (this.client.data.status === 1 && !this._epRef) {
				evQueueService.on(
					`enqueue/${process.env.INPUT_MODULE_USER}`,
					data => {
						this.eventQueue.push("ENQUEUE");
					},
					(err, _eventRef) => {
						if (err) {
							log.error("Failed to subscribe to queue endpoint", err);
							return;
						}

						this._epRef = _eventRef;
					},
				);
			}
		} catch (error) {
			log.error(error);
		}
	})();
};

EndpointService.prototype.checkQueue = function($happn) {
	const { queueService: epQueueService } = this.client.exchange[process.env.INPUT_MODULE_NAME];
	const { log } = $happn;

	return (async () => {
		try {
			if (this.status === "CONNECTED") {
				let queueCount = await epQueueService.size(process.env.INPUT_MODULE_USER);

				if (queueCount === 0) {
					log.info("CALLED BUT QUEUE IS EMPTY");
					return true;
				}

				for (let i = 0; i < queueCount; i++) {
					let packet = await epQueueService.dequeue(process.env.INPUT_MODULE_USER);

					if (packet) {
						this.incomingQueue.push(packet);
					} else {
						log.error("packet", packet);
						queueCount = await epQueueService.size(process.env.INPUT_MODULE_USER);
						log.info("Client Status ", this.client.data.status);
						log.error("Break in queue service........");
						break;
					}
				}
				return true;
			}
		} catch (err) {
			log.error("Error checking queue ", err);
			return false;
		}
	})();
};

module.exports = EndpointService;
