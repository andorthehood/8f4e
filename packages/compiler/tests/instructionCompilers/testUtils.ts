import { Instruction } from '../../src/instructionCompilers';
import { BLOCK_TYPE } from '../../src/types';

import type { AST, CompilationContext } from '../../src/types';

export function createMockContext(): CompilationContext {
	return {
		namespace: {
			locals: {},
			memory: {},
			consts: {},
			moduleName: '',
			namespaces: {},
		},
		initSegmentByteCode: [],
		loopSegmentByteCode: [],
		stack: [],
		blockStack: [
			{
				hasExpectedResult: false,
				expectedResultIsInteger: false,
				blockType: BLOCK_TYPE.MODULE,
			},
		],
		startingByteAddress: 0,
		memoryByteSize: 0,
	};
}

export function createMockASTLeaf(instruction: Instruction): AST[number] {
	return {
		instruction,
		arguments: [],
		lineNumber: 0,
	};
}
