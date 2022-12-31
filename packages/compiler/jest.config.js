module.exports = {
	transform: {
		"^.+\\.(t|j)sx?$": ["@swc/jest"],
	},
	testMatch: ['/**/*.test.ts'],
};
