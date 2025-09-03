import { Instruction } from '../../src/instructionCompilers';
import type { AST, CompilationContext } from '../../src/types';
import { BLOCK_TYPE } from '../../src/types';

export function createMockContext(): CompilationContext {
	return {
		namespace: {
			locals: new Map(),
			memory: new Map(),
			consts: {},
			moduleName: '',
			namespaces: new Map(),
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
