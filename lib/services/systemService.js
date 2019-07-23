const defaultConstant = require("../constants/defaultAppConstants").DefaultConstants;

function SystemService() {}

SystemService.prototype.checkConfiguration = function($happn) {
	const { systemService, security } = $happn.exchange;
	const { log } = $happn;

	return (async () => {
		try {
			let config = await systemService.getConfigData();

			if (!config) {
				log.warn(`No configuration data found........`);

				config = await systemService.setConfigData(new defaultConstant(), "persist/configuration");

				log.warn("Setting Default Configuration.........");
			}

			config.security.defaultGroups.forEach(group => {
				security.upsertGroup(group, err => {
					if (err) log.error("cannot create group", err);
				});
			});

			config.security.defaultUsers.forEach(user => {
				security.upsertUser(user, err => {
					if (err) log.error("cannot create group", err);
				});
			});

			config.setupComplete = true;

			await systemService.setConfigData(config, "persist/configuration");
			return config;
		} catch (err) {
			log.error("Error checking configuration data", err);
		}
	})();
};

SystemService.prototype.upsertHistory = function($happn, historyObj) {
	const { systemRepository } = $happn.exchange;
	const { log } = $happn;

	return (async () => {
		try {
			let history = await systemRepository.get("history");

			if (!history) history = historyObj;

			const propkeys = Object.keys(history);
			propkeys.forEach(prp => {
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

SystemService.prototype.getConfigData = function($happn) {
	const { systemRepository } = $happn.exchange;
	const { log } = $happn;

	return (async () => {
		try {
			const config = await systemRepository.get("configuration");
			return config;
		} catch (err) {
			log.error("Error getting config data from repo");
		}
	})();
};

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

SystemService.prototype.deleteConfig = function($happn) {
	const { systemRepository } = $happn.exchange;
	const { log } = $happn;

	return (async () => {
		try {
			const config = await systemRepository.delete("config");
			return config;
		} catch (err) {
			log.error("Error setting config data to repo");
		}
	})();
};

module.exports = SystemService;
