const {
	DefaultConstants,
	defaultGroups,
	defaultUsers
} = require("../constants/defaultAppConstants");
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
	const { systemService, systemRepository } = $happn.exchange;
	const { log } = $happn;

	return (async () => {
		try {
			let config = await systemRepository.get("configuration");

			if (!config) {
				log.warn(`No configuration data found........`);
				log.warn("Setting Default Configuration.........");

				config = await systemService.setConfigData(new DefaultConstants(), "persist/configuration");
				await systemService.setStartupUsers(config);
			}

			config.secure = await systemService.checkStartUpUsers(config);

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
 * @summary Initial user and group setup for an empty database
 * @param {$happn} $happn Dependancy Injection of the Happner Framework
 * @returns {Promise} void
 * @mermaid graph LR
 				A[App]-.->B(entry)
				subgraph setStartupUsers
				B-->C[upsertGroups]
				C-->D[upsertUsers]
				end
 */
SystemService.prototype.setStartupUsers = function($happn) {
	const { log } = $happn;
	const { security } = $happn.exchange;

	const upsertUser = user =>
		new Promise(resolve => {
			security.upsertUser(user, err => {
				if (err) {
					log.error("cannot create user", err);
				}
				resolve();
			});
		});

	const upsertGroup = group =>
		new Promise(resolve => {
			security.upsertGroup(group, err => {
				if (err) {
					log.error("cannot create group", err);
				}
				resolve();
			});
		});

	return (async () => {
		try {
			log.warn("Setting up temporary users....ensure that these are changed using the UI");

			for (const group of defaultGroups) {
				await upsertGroup(group);
			}

			for (const user of defaultUsers) {
				await upsertUser(user);
			}
		} catch (err) {
			log.error("Error setting up default users and groups", err);
		}
	})();
};

/**
 * @summary check that the initail user password has been modified from the default
 * @param {$happn} $happn Dependancy Injection of the Happner Framework
 * @returns {Promise<boolean>} bool
 * @mermaid graph LR
				defaultUsers-->|get|B[application_data.state]
				B-->|INSECURE|E[resultArray]
				B-->|SECURE|null
				E -->|return|R[resultArray >0]
				
 */
SystemService.prototype.checkStartUpUsers = function($happn) {
	const { security } = $happn.exchange;
	const { log } = $happn;

	const listUser = user =>
		new Promise(resolve => {
			security.listUsers(user.username).then(user => {
				if (user.length > 0) {
					resolve(user[0]);
				} else {
					resolve(null);
				}
			});
		});

	return (async () => {
		let result = [];

		for (const user of defaultUsers) {
			const systemUser = listUser(user);

			if (
				systemUser &&
				systemUser.application_data &&
				systemUser.application_data.state === "INSECURE"
			) {
				log.warn(
					`User ${systemUser.username} is not secure.  Please urgently change password in UI`
				);
				result.push(systemUser);
			}
		}

		return result.length === 0;
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
 * @summary Reset all configuration data in the data store as well as removing users
 * @param {$happn} $happn Dependancy Injection of the Happner Framework
 * @param {object} payload config object
 * @returns {Promise<object>} return config
 */
SystemService.prototype.resetRouterData = function($happn) {
	const { log } = $happn;
	const { systemService, security } = $happn.exchange;

	return (async () => {
		try {
			log.warn("resetting all data");
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

			await systemService.deleteConfig();
		} catch (err) {
			console.log(err);
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

module.exports = SystemService;
