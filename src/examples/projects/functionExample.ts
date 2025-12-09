import type { Project } from '@8f4e/editor-state';

const project: Project = {
	codeBlocks: [
		{
			code: [
				'config',
				'',
				'scope "title"',
				'push "Function Example"',
				'set',
				'',
				'rescope "description"',
				'push "Demonstrates using a helper function to square numbers"',
				'set',
				'',
				'rescope "author"',
				'push "Andor Polgar"',
				'set',
				'',
				'rescope "memorySizeBytes"',
				'push 65536',
				'set',
				'',
				'configEnd',
			],
			gridCoordinates: { x: -50, y: 1 },
		},
		{
			code: [
				'function square int',
				'; Takes a number on the stack',
				'; and returns its square',
				'',
				'push 2',
				'mul',
				'',
				'functionEnd int',
			],
			gridCoordinates: { x: -15, y: 1 },
		},
		{
			code: [
				'module calculator',
				'',
				'int input 5',
				'int output',
				'',
				'; Use the square function',
				'loop',
				'  push &output',
				'  push input',
				'  call square',
				'  store',
				'loopEnd',
				'',
				'moduleEnd',
			],
			gridCoordinates: { x: 10, y: 1 },
		},
	],
	viewport: {
		gridCoordinates: { x: 0, y: 0 },
	},
};

export default project;
