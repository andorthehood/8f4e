import { BlockType } from '@8f4e/compiler-spec';

import type { CompilationContext } from '@8f4e/compiler-spec';

export default function createInstructionCompilerTestContext(
	overrides: Partial<CompilationContext> = {}
): CompilationContext {
	const base: CompilationContext = {
		namespace: {
			namespaces: {},
			memory: {},
			consts: {},
			moduleName: 'test',
		},
		locals: {},
		internalResources: {},
		internalAllocator: {
			nextByteAddress: 0,
		},
		stack: [],
		blockStack: [
			{
				blockType: BlockType.MODULE,
				expectedResultIsInteger: false,
				hasExpectedResult: false,
			},
		],
		startingByteAddress: 0,
		currentModuleNextWordOffset: 0,
		currentModuleWordAlignedSize: 0,
		byteCode: [],
		codeBlockId: 'test',
		codeBlockType: 'module',
	};

	return {
		...base,
		...overrides,
		namespace: {
			...base.namespace,
			...overrides.namespace,
		},
	};
}
