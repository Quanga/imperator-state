const Endpoints = {
	endpoints:
		process.env.USE_LOCAL_SERVICES === "true"
			? {
					"mesh-pdf": {
						reconnect: { max: 2000, retries: 100 },
						config: {
							host: "imperator_pdf_1",
							port: 55030,
							username: "_ADMIN",
							password: "happn",
						},
					},
					"mesh-mailer": {
						reconnect: { max: 2000, retries: 100 },
						config: {
							host: "imperator_mailer_1",
							port: 55006,
							username: "_ADMIN",
							password: "happn",
						},
					},
			  }
			: {},
};

module.exports = Endpoints;
