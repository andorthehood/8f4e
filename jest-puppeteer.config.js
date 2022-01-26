module.exports = {
	server: {
		command: `npm run sprite`,
		port: 3001,
		protocol: 'http',
		launchTimeout: 30000,
		debug: true,
	},
	launch: {
		dumpio: true,
		headless: process.env.HEADLESS !== 'false',
		args: ['--disable-infobars', '--no-sandbox', '--disable-setuid-sandbox'],
		timeout: 120000,
	},
};
