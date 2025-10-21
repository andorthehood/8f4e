import type { Project } from '@8f4e/editor-state';

const project: Project = {
	title: 'Simple Counter (Main Thread)',
	author: 'Andor Polgar',
	description: 'A simple counter demonstration running on the main thread logic runtime',
	codeBlocks: [
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
			x: 0,
			y: 0,
			isOpen: true,
		},
	],
	viewport: { x: 0, y: 0 },
	selectedRuntime: 0,
	runtimeSettings: [
		{
			runtime: 'MainThreadLogicRuntime',
			sampleRate: 10,
		},
	],
};

export default project;
