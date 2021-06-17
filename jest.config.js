module.exports = {
	preset: 'ts-jest',
	testEnvironment: 'node',
	moduleNameMapper: {
		'bytecode-utils': '<rootDir>/packages/bytecode-utils/src',
		compiler: '<rootDir>/packages/compiler/src',
		'2d-engine': '<rootDir>/packages/2d-engine/src',
	},
	globals: {
		'ts-jest': {
			tsconfig: 'tsconfig.json',
			diagnostics: {
				warnOnly: true,
			},
		},
	},
};
