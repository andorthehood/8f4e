import { Project } from '../../../packages/editor/src/state/types';

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
				'float out',
				'',
				'; Increment counter each cycle',
				'push value',
				'push 1',
				'add',
				'push &value',
				'store',
				'',
				'; Convert to float and output',
				'push value',
				'castToFloat',
				'push &out',
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
			sampleRate: 10, // Slower for demonstration
		},
	],
};

export default project;