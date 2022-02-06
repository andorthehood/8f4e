module.exports = {
	preset: './jest-presets.js',
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
