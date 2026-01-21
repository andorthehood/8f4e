import type { Project } from '@8f4e/editor-state';

const project: Project = {
	codeBlocks: [
		{
			code: [
				'config project',
				'',
				'scope "memorySizeBytes"',
				'push 65536',
				'set',
				'popScope',
				'',
				'scope "runtimeSettings"',
				'scope "runtime"',
				'push "MainThreadLogicRuntime"',
				'set',
				'rescopeTop "sampleRate"',
				'push 10',
				'set',
				'popScope',
				'popScope',
				'',
				'configEnd',
			],
			gridCoordinates: {
				x: -5,
				y: 3,
			},
		},
		{
			code: [
				'module counter',
				'',
				'int value 0',
				'',
				'# debug value',
				'',
				'push &value',
				'push 1',
				'push value',
				'add',
				'store',
				'',
				'moduleEnd',
			],
			gridCoordinates: {
				x: 82,
				y: 3,
			},
		},
		{
			code: [
				'constants env',
				'; Auto-generated environment constants',
				'; Changes will be overwritten',
				'; Last updated: 1/19/2026, 10:01:14 PM',
				'',
				'const SAMPLE_RATE 10',
				'const AUDIO_BUFFER_SIZE 128',
				'',
				'constantsEnd',
			],
			gridCoordinates: {
				x: 34,
				y: 3,
			},
		},
	],
	viewport: {
		gridCoordinates: {
			x: -8,
			y: 1,
		},
	},
};

export default project;
