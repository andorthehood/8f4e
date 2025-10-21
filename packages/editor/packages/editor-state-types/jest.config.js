export default {
	displayName: '@8f4e/editor-state-types',
	testEnvironment: 'node',
	transform: {
		'^.+\\.[tj]sx?$': ['@swc/jest', {
			jsc: {
				target: 'es2021',
			},
			sourceMaps: true,
		}],
	},
	moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
	coverageDirectory: '../../../../coverage/packages/editor/packages/editor-state-types',
};
