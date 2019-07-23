/*
 
App.prototype.checkConfiguration = function($happn) {
	const { app, security } = $happn.exchange;
	const { log } = $happn;

	return (async () => {
		this.configuration = await app.getRouterConfigData();

		if (!this.configuration) {
			log.warn("NO CONFIGURATION DATA FOUND - APPLYING DEFAULT");
			this.configuration = await app.setRouterConfigData(
				new defaultConstant(),
				"persist/configuration"
			);
			log.warn("DEFAULT CONFIGURATION DATA SET");
		}

		this.configuration.security.defaultGroups.forEach(group => {
			security.upsertGroup(group, (err, upserted) => {
				if (err) logError("cannot create group", err);
			});
		});

		this.configuration.security.defaultUsers.forEach(user => {
			security.upsertUser(user, function(err, upserted) {
				if (err) logError("cannot create group", err);
			});
		});

		const { setupIssues } = this.configuration;
		setupIssues.length = 0;

		if (this.configuration.identifier.name === "") {
			setupIssues.push("Identifier Name not set!");
			warn("CONFIG- ID NAME NOT SET");
		}

		if (setupIssues.length === 0) {
			this.configuration.setupComplete = true;
		}

		await app.setRouterConfigData(this.configuration, "persist/configuration");
	})();
};




App.prototype.getRouterConfigData = function($happn) {
	const { data } = $happn.exchange;

	return new Promise((resolve, reject) => {
		data.get("persist/configuration", null, (error, response) => {
			if (error) return reject(error);

			return resolve(response);
		});
	});
};

App.prototype.setRouterConfigData = function($happn, payload) {
	const { data } = $happn.exchange;

	return new Promise((resolve, reject) => {
		data.set("persist/configuration", payload, {}, (error, response) => {
			if (error) return reject(error);

			return resolve(response);
		});
	});
};

App.prototype.resetRouterData = function($happn) {
	const { data } = $happn.exchange;

	return new Promise((resolve, reject) => {
		data.remove("*", {}, (error, response) => {
			if (error) return reject(error);
			resolve(true);
		});
	});
};



App.prototype.writeHistory = function($happn, incoming) {
	const { data } = $happn.exchange;

	const getAsync = () =>
		new Promise((resolve, reject) => {
			data.get("persist/history", null, (error, response) => {
				if (error) return reject(error);
				resolve(response);
			});
		});

	const writeAsync = payload =>
		new Promise((resolve, reject) => {
			data.set("persist/history", payload, {}, (error, response) => {
				if (error) return reject(error);

				return resolve(response);
			});
		});

	const writeHistoryAsync = async updatedVal => {
		try {
			let history = await getAsync();
			if (!history) history = this.historyObj;
            const
             propkey = Object.keys(updatedVal);
			propkey.forEach(prp => {
				if (history.hasOwnProperty(prp)) {
					if (history[prp] instanceof Array) {
						return history[prp].push(updatedVal[prp]);
					} else {
						return (history[prp] = updatedVal[prp]);
					}
				} else {
					return (history[prp] = updatedVal[prp]);
				}
			});

			await writeAsync(history);
		} catch (error) {
			console.log(error);
			return Promise.reject(error);
		}
	};
	return writeHistoryAsync(incoming);
};
 */
