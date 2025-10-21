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
	moduleNameMapper: {
		'^@8f4e/editor-state-types$': '<rootDir>/../editor-state-types/src/index.ts',
		'^@8f4e/sprite-generator$': '<rootDir>/../sprite-generator/src/index.ts',
		'^@8f4e/state-manager$': '<rootDir>/../state-manager/src/index.ts',
		'^@8f4e/compiler$': '<rootDir>/../../../../compiler/src/index.ts',
	},
	coverageDirectory: '../../../../coverage/packages/editor/packages/editor-state',
	collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.d.ts', '!src/**/*.test.{ts,tsx}', '!src/**/*.spec.{ts,tsx}'],
};
