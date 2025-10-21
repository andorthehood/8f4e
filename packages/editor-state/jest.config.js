export default {
	displayName: '@8f4e/editor-state',
	testEnvironment: 'node',
	roots: ['<rootDir>/src'],
	testMatch: ['**/__tests__/**/*.+(ts|tsx|js)', '**/*.(test|spec).+(ts|tsx|js)'],
	transform: {
		'^.+\\.(t|j)sx?$': [
			'@swc/jest',
			{
				jsc: {
					parser: { syntax: 'typescript', tsx: false },
					transform: { react: { runtime: 'automatic' } },
					target: 'es2022',
				},
			},
		],
	},
	moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
	coverageDirectory: '../../coverage/packages/editor-state',
	collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.d.ts', '!src/**/*.test.{ts,tsx}', '!src/**/*.spec.{ts,tsx}'],
};
