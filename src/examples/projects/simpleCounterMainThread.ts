import type { Project } from '@8f4e/editor-state';

const project: Project = {
	codeBlocks: [
		{
			code: [
				'config',
				'',
				'scope "memorySizeBytes"',
				'push 65536',
				'set',
				'popScope',
				'',
				'scope "selectedRuntime"',
				'push 0',
				'set',
				'popScope',
				'',
				'scope "runtimeSettings[0]"',
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
			gridCoordinates: { x: -35, y: 0 },
		},
		{
			code: [
				'module counter',
				'',
				'int value 0',
				'',
				'debug value',
				'',
				'push &value',
				'push 1',
				'push value',
				'add',
				'store',
				'',
				'moduleEnd',
			],
			gridCoordinates: { x: 0, y: 0 },
		},
	],
	viewport: { gridCoordinates: { x: 0, y: 0 } },
};

export default project;
