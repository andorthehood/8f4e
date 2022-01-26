module.exports = {
	preset: './jest-presets.js',
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
	setupFilesAfterEnv: ['./jest.image.ts'],
};
