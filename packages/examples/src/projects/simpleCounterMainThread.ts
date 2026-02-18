import type { Project } from '@8f4e/editor-state';

const project: Project = {
	codeBlocks: [
		{
			code: [
				'config project',
				'; @pos -5 3',
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
		},
		{
			code: [
				'module counter',
				'; @pos 82 3',
				'',
				'int value 0',
				'',
				'; @debug value',
				'',
				'push &value',
				'push 1',
				'push value',
				'add',
				'store',
				'',
				'moduleEnd',
			],
		},
		{
			code: [
				'constants env',
				'; @pos 34 3',
				'; Auto-generated environment constants',
				'; Changes will be overwritten',
				'; Last updated: 1/19/2026, 10:01:14 PM',
				'',
				'const SAMPLE_RATE 10',
				'const AUDIO_BUFFER_SIZE 128',
				'',
				'constantsEnd',
			],
		},
	],
};

export default project;
