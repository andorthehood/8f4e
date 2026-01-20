import { MemoryTypes } from '@8f4e/compiler';

import type { Project } from '@8f4e/editor-state';

const standalonProject: Project = {
	codeBlocks: [
		{
			code: [
				'config',
				'',
				'scope "memorySizeBytes"',
				'push 8',
				'set',
				'popScope',
				'',
				'scope "runtimeSettings"',
				'scope "runtime"',
				'push "WebWorkerLogicRuntime"',
				'set',
				'rescopeTop "sampleRate"',
				'push 1',
				'set',
				'',
				'rescope disableAutoCompilation',
				'push true',
				'set ',
				'',
				'configEnd',
			],
			gridCoordinates: {
				x: -14,
				y: 8,
			},
		},
		{
			code: [
				'module counter',
				'',
				'int count',
				'debug count',
				'',
				'push &count',
				'push count',
				'push 1',
				'add',
				'store',
				'',
				'moduleEnd',
			],
			gridCoordinates: {
				x: 25,
				y: 8,
			},
		},
	],
	viewport: {
		gridCoordinates: {
			x: -19,
			y: 4,
		},
	},
	compiledModules: {
		counter: {
			id: 'counter',
			loopFunction: [15, 0, 65, 4, 65, 4, 40, 2, 0, 65, 1, 106, 54, 2, 0, 11],
			initFunctionBody: [],
			byteAddress: 4,
			wordAlignedAddress: 1,
			memoryMap: {
				count: {
					numberOfElements: 1,
					elementWordSize: 4,
					wordAlignedAddress: 1,
					wordAlignedSize: 1,
					byteAddress: 4,
					id: 'count',
					default: 0,
					type: 'int' as unknown as MemoryTypes,
					isPointer: false,
					isPointingToInteger: false,
					isPointingToPointer: false,
					isInteger: true,
				},
			},
			wordAlignedSize: 1,
			index: 0,
		},
	},
	compiledWasm:
		'AGFzbQEAAAABDwNgAABgAX8Bf2ACf38BfwIPAQJqcwZtZW1vcnkCAwEBAwYFAAAAAAAHGQMEaW5pdAAABWN5Y2xlAAEGYnVmZmVyAAIKogIFBAAQBAsEABADC4ICABABEAEQARABEAEQARABEAEQARABEAEQARABEAEQARABEAEQARABEAEQARABEAEQARABEAEQARABEAEQARABEAEQARABEAEQARABEAEQARABEAEQARABEAEQARABEAEQARABEAEQARABEAEQARABEAEQARABEAEQARABEAEQARABEAEQARABEAEQARABEAEQARABEAEQARABEAEQARABEAEQARABEAEQARABEAEQARABEAEQARABEAEQARABEAEQARABEAEQARABEAEQARABEAEQARABEAEQARABEAEQARABEAEQARABEAEQARABEAEQARABEAEQARABEAEQARABEAELDwBBBEEEKAIAQQFqNgIACwIACw==',
	memorySnapshot: 'AAAAABcAAAA=',
	compiledConfig: {
		memorySizeBytes: 8,
		runtimeSettings: {
			runtime: 'WebWorkerLogicRuntime',
			sampleRate: 1,
		},
		disableAutoCompilation: true,
		binaryAssets: [],
	},
};

export default standalonProject;
