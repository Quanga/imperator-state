const Endpoints = {
	endpoints:
		process.env.USE_LOCAL_SERVICES === "true"
			? {
					"mesh-pdf": {
						reconnect: { max: 2000, retries: 100 },
						config: {
							host: process.env.PDF_HOST,
							port: process.env.PDF_PORT || 55030,
							username: process.env.PDF_USER,
							password: process.env.PDF_PASS,
						},
					},
					"mesh-mailer": {
						reconnect: { max: 2000, retries: 100 },
						config: {
							host: process.env.MAILER_HOST,
							port: process.env.MAILER_PORT || 55006,
							username: process.env.MAILER_USER,
							password: process.env.MAILER_PASS,
						},
					},
			  }
			: {},
};

module.exports = Endpoints;
