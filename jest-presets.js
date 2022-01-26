const tsJestPreset = require('ts-jest/jest-preset');
const jestPuppeteerPreset = require('jest-puppeteer/jest-preset');

module.exports = {
	...jestPuppeteerPreset,
	...tsJestPreset,
};
