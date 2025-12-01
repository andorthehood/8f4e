import type { Project } from '@8f4e/editor-state';

const project: Project = {
	memorySizeBytes: 65536,
	title: '',
	author: '',
	description: '',
	codeBlocks: [
		{
			code: [
				'config',
				'',
				'scope "projectInfo"',
				'  scope "title"',
				'    push "Simple Counter (Main Thread)"',
				'    set',
				'  rescopeTop "author"',
				'    push "Andor Polgar"',
				'    set',
				'  rescopeTop "description"',
				'    push "A simple counter demonstration running on the main thread logic runtime"',
				'    set',
				'popScope',
				'',
				'scope "memorySizeBytes"',
				'  push 65536',
				'  set',
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
	selectedRuntime: 0,
	runtimeSettings: [
		{
			runtime: 'MainThreadLogicRuntime',
			sampleRate: 10,
		},
	],
};

export default project;
