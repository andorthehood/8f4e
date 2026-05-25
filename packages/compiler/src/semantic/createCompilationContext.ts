import { BlockType } from '@8f4e/compiler-spec';

import type { BlockStack, CompilationContext } from '@8f4e/compiler-spec';

type CompilationContextOverrides<TContext extends CompilationContext = CompilationContext> = Partial<
	Omit<TContext, 'namespace'>
> & {
	namespace?: Partial<TContext['namespace']>;
};

function getBlockContextFlags(blockStack: BlockStack) {
	return {
		insideModuleBlock: blockStack.some(block => block.blockType === BlockType.MODULE),
		insideFunctionBlock: blockStack.some(block => block.blockType === BlockType.FUNCTION),
		insideGenericBlock: blockStack.some(block => block.blockType === BlockType.BLOCK),
		insideLoopBlock: blockStack.some(block => block.blockType === BlockType.LOOP),
		insideConditionBlock: blockStack.some(block => block.blockType === BlockType.CONDITION),
		insideConstantsBlock: blockStack.some(block => block.blockType === BlockType.CONSTANTS),
		insideMapBlock: blockStack.some(block => block.blockType === BlockType.MAP),
	};
}

export function createCompilationContext<TContext extends CompilationContext = CompilationContext>(
	overrides: CompilationContextOverrides<TContext> = {}
): TContext {
	const base: CompilationContext = {
		namespace: {
			namespaces: {},
			memory: {},
			consts: {},
			moduleName: undefined,
		},
		locals: {},
		internalResources: {},
		internalAllocator: {
			nextByteAddress: 0,
		},
		byteCode: [],
		stack: [],
		blockStack: [],
		insideModuleBlock: false,
		insideFunctionBlock: false,
		insideGenericBlock: false,
		insideLoopBlock: false,
		insideConditionBlock: false,
		insideConstantsBlock: false,
		insideMapBlock: false,
		startingByteAddress: 0,
		currentModuleNextWordOffset: 0,
		currentModuleWordAlignedSize: 0,
		currentMemoryIndex: 0,
		memoryRegions: [],
		mode: 'module',
	};

	const context = {
		...base,
		...overrides,
		namespace: {
			...base.namespace,
			...overrides.namespace,
		},
	};
	const blockContextFlags = getBlockContextFlags(context.blockStack);

	return {
		...context,
		insideModuleBlock: overrides.insideModuleBlock ?? blockContextFlags.insideModuleBlock,
		insideFunctionBlock: overrides.insideFunctionBlock ?? blockContextFlags.insideFunctionBlock,
		insideGenericBlock: overrides.insideGenericBlock ?? blockContextFlags.insideGenericBlock,
		insideLoopBlock: overrides.insideLoopBlock ?? blockContextFlags.insideLoopBlock,
		insideConditionBlock: overrides.insideConditionBlock ?? blockContextFlags.insideConditionBlock,
		insideConstantsBlock: overrides.insideConstantsBlock ?? blockContextFlags.insideConstantsBlock,
		insideMapBlock: overrides.insideMapBlock ?? blockContextFlags.insideMapBlock,
	} as TContext;
}
