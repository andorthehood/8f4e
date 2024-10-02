import { Instruction } from '../../src/instructionCompilers';
import { AST, CompilationContext } from '../../src/types';

export function createMockContext(): CompilationContext {
	return {
		namespace: {
			locals: new Map(),
			memory: new Map(),
			consts: {},
			moduleName: '',
			namespaces: new Map(),
		},
		stack: [],
		blockStack: [
			{
				hasExpectedResult: false,
				expectedResultIsInteger: false,
				isModuleBlock: true,
				isGroupBlock: false,
				isLoop: false,
				isConditionBlock: false,
				isFunctionBlock: false,
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
