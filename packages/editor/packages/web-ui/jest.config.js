export default {
	displayName: '@8f4e/web-ui',
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
	coverageDirectory: '../../../../coverage/packages/editor/packages/web-ui',
};
