const { DefaultConstants } = require("../constants/defaultAppConstants");
const fs = require("fs");
const path = require("path");
const os = require("os");

/**
 * @category System
 * @module lib/services/systemService
 * @summary  General System service to handle configuration
 */

/**
 * @category System
 * @class SystemService
 */
function SystemService() {}

/**
 * @summary Run through system and security checks
  <ul>
  <li>Starts the App Component when Happner loads all components </li>
  <li>Checks whether a RESET arg has been supplied to the node process.</li>
  <li>Checks the Configuration to get its running information.</li>
  <li>runs [startRouter]{@link module:app~App#startRouter} if all check work</li>
  </ul><br>
 * @param {$happn} $happn Dependancy Injection of the Happner Framework
 * @returns {Promise<config>} Config Object
 * @mermaid graph LR
 				A[App]-.->|get|C[systemRepository.get.configuration]

				 subgraph checkConfiguration
				C-->D{exists}
				D-->|FALSE|E[setConfigData]
				E-->G[setStartupUsers]
				D-->|TRUE|F[CheckSecurity]
				F-->config.secure
				G-->F
				F-->H[setup.complete]
				end
				config.secure-->return[return config]
				H-->return
 */
SystemService.prototype.checkConfiguration = function($happn) {
	const { systemService, systemRepository, securityService } = $happn.exchange;
	const { log } = $happn;

	return (async () => {
		try {
			let config = await systemRepository.get("configuration");

			if (!config) {
				log.warn(`No configuration data found........`);
				log.warn("Setting Default Configuration.........");

				config = await systemService.setConfigData(new DefaultConstants(), "persist/configuration");
				await securityService.setStartupUsers(config);
			}

			config.secure = await securityService.checkStartUpUsers(config);

			if (!config.secure) {
				config.setupComplete = false;
			} else {
				config.setupComplete = false;
			}

			return config;
		} catch (err) {
			log.error("Error checking configuration data", err);
		}
	})();
};

/**
 * @summary Sets the configurate data to the SystemRepository
 * @param {$happn} $happn Dependancy Injection of the Happner Framework
 * @param {object} payload config object
 * @returns {Promise<object>} return config
 */
SystemService.prototype.setConfigData = function($happn, payload) {
	const { systemRepository } = $happn.exchange;
	const { log } = $happn;

	return (async () => {
		try {
			const config = await systemRepository.set("configuration", payload);
			return config;
		} catch (err) {
			log.error("Error setting config data to repo");
		}
	})();
};

/**
 * @summary Gets the configurate data to the SystemRepository
 * @param {$happn} $happn Dependancy Injection of the Happner Framework
 * @param {object} payload config object
 * @returns {Promise<object>} return config
 */
SystemService.prototype.getConfigData = function($happn) {
	const { systemRepository } = $happn.exchange;
	const { log } = $happn;

	return (async () => {
		try {
			const config = await systemRepository.get("configuration");
			return config;
		} catch (err) {
			log.error("Error setting config data to repo");
		}
	})();
};

/**
 * @summary Reset all configuration data in the data store as well as removing users
 * @param {$happn} $happn Dependancy Injection of the Happner Framework
 * @param {object} payload config object
 * @returns {Promise<object>} return config
 */
SystemService.prototype.resetRouterData = function($happn) {
	const { log } = $happn;
	const { systemService } = $happn.exchange;

	return (async () => {
		try {
			log.warn("resetting all data");
			await systemService.resetUsers();
			await systemService.deleteConfig();
		} catch (err) {
			console.log(err);
		}
	})();
};

/**
 * @summary Reset all configuration data in the data store as well as removing users
 * @param {$happn} $happn Dependancy Injection of the Happner Framework
 * @param {object} payload config object
 * @returns {Promise<object>} return config
 */
SystemService.prototype.resetUsers = function($happn) {
	const { log } = $happn;
	const { security } = $happn.exchange;

	return (async () => {
		try {
			log.warn("resetting all users");
			let users = await new Promise(resolve => {
				security.listUsers("*").then(users => resolve(users));
			});

			users = users.filter(user => user.username !== "_ADMIN");
			log.warn(`Removing ${users.length} from the server`);

			for (const user of users) {
				await new Promise(resolve => {
					security.deleteUser(user, (err, resp) => {
						if (err) return resolve("err", err);
						resolve(resp);
					});
				});
			}
		} catch (err) {
			console.log(err);
		}
	})();
};

/**
 * @summary Add an entry to the History
 * @param {$happn} $happn Dependancy Injection of the Happner Framework
 * @param {object} historyObj Dependancy Injection of the Happner Framework
 * @returns {Promise} void
 * @example { stopped: Date.now() }
 */
SystemService.prototype.upsertHistory = function($happn, historyObj) {
	const { systemRepository } = $happn.exchange;
	const { log } = $happn;

	return (async () => {
		try {
			let history = await systemRepository.get("history");

			if (!history) history = { stopped: [], started: [] };

			const propKeys = Object.keys(history);

			propKeys.forEach(prp => {
				if (history.hasOwnProperty(prp)) {
					if (history[prp] instanceof Array) {
						return history[prp].push(historyObj[prp]);
					} else {
						return (history[prp] = historyObj[prp]);
					}
				} else {
					return (history[prp] = historyObj[prp]);
				}
			});

			await systemRepository.set("history", history);
		} catch (err) {
			log.error("Error upserting history", err);
		}
	})();
};

/**
 * @summary Remove the config object from the persisted story
 * @param {$happn} $happn Dependancy Injection of the Happner Framework
 * @returns {Promise} void
 */
SystemService.prototype.deleteConfig = function($happn) {
	const { systemRepository } = $happn.exchange;
	const { log } = $happn;

	return (async () => {
		try {
			log.warn("Deleting config file");
			const config = await systemRepository.delete("configuration");
			return config;
		} catch (err) {
			log.error("Error setting config data to repo");
		}
	})();
};

SystemService.prototype.getWifiSettings = function($happn) {
	const { systemRepository } = $happn.exchange;

	return (async () => {
		let response = await systemRepository.get("wifi");

		const generic = {
			ssid: "NETWORK-SSID",
			encryption: "WPA",
			networkPassword: "sample",
			ip: "192.168.1.23",
			mask: "255.255.255.0",
			gateway: "192.168.1.231",
			dhcp: true,
			types: ["WPA2 + AES", "WPA + AES", "WPA + TKIP/AES", "WPA + TKIP", "WEP"]
		};

		return { ...generic, ...response };
	})();
};

SystemService.prototype.setWifiSettings = function($happn, settingsObj, filename) {
	const { systemRepository, systemService } = $happn.exchange;

	return (async () => {
		let response = await systemRepository.set("wifi", settingsObj);
		let writeResponse = await systemService.writeJSON(filename, settingsObj);

		if (!response) return {};

		return { response, writeResponse };
	})();
};

SystemService.prototype.writeJSON = function($happn, filename, jsonObj) {
	const { log } = $happn;

	return new Promise((resolve, reject) => {
		if (typeof filename !== "string") return reject(`file must be a string`);
		fs.writeFile(
			path.resolve(os.homedir(), filename ? `./${filename}` : "default.json"),
			JSON.stringify(jsonObj),
			(error, resp) => {
				if (error) {
					log.error(error);
					reject(error);
				}
				resolve(resp);
			}
		);
	});
};

module.exports = SystemService;
