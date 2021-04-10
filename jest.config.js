module.exports = {
	preset: 'ts-jest',
	testEnvironment: 'node',
	moduleNameMapper: {
		'bytecode-utils': '<rootDir>/packages/bytecode-utils/src',
		compiler: '<rootDir>/packages/compiler/src',
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
