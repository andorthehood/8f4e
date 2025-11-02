export default {
	testEnvironment: 'node',
	roots: ['<rootDir>/src'],
	testMatch: ['**/__tests__/**/*.+(ts|tsx|js)', '**/*.(test|spec).+(ts|tsx|js)'],
	transform: {
		'^.+\\.(t|j)sx?$': [
			'@swc/jest',
			{
				jsc: {
					target: 'es2021',
					parser: {
						syntax: 'typescript',
						tsx: false,
						decorators: false,
					},
					transform: null,
				},
				module: {
					type: 'es6',
				},
				sourceMaps: true,
			},
		],
	},
	moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
	collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.d.ts'],
	coverageDirectory: 'coverage',
	coverageReporters: ['text', 'lcov', 'html'],
	extensionsToTreatAsEsm: ['.ts'],
};
