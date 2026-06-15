import type {
	BlockStack,
	BlockTypeValue,
	CompilationContext,
	LoopBlockStackFrame,
	MapBlockStackFrame,
} from '@8f4e/compiler-spec';
import { BlockType } from '@8f4e/compiler-spec';

/** Partial context shape used by tests and compiler stages when seeding a compilation context. */
type CompilationContextOverrides<TContext extends CompilationContext = CompilationContext> = Partial<
	Omit<TContext, 'namespace'>
> & {
	namespace?: Partial<TContext['namespace']>;
};

/** Creates an all-zero active block depth map keyed by compiler block type. */
function createEmptyBlockDepths(): Record<BlockTypeValue, number> {
	return {
		[BlockType.MODULE]: 0,
		[BlockType.FUNCTION]: 0,
		[BlockType.BLOCK]: 0,
		[BlockType.LOOP]: 0,
		[BlockType.CONDITION]: 0,
		[BlockType.CONSTANTS]: 0,
		[BlockType.MAP]: 0,
	};
}

/** Derives cached active block state from an already-seeded block stack. */
function getBlockState(blockStack: BlockStack): {
	activeBlockDepths: Record<BlockTypeValue, number>;
	activeLoopBlocks: LoopBlockStackFrame[];
	activeMapBlock?: MapBlockStackFrame;
} {
	const activeBlockDepths = createEmptyBlockDepths();
	const activeLoopBlocks: LoopBlockStackFrame[] = [];
	let activeMapBlock: MapBlockStackFrame | undefined;

	for (const block of blockStack) {
		activeBlockDepths[block.blockType]++;

		if (block.blockType === BlockType.LOOP) {
			activeLoopBlocks.push(block);
		}

		if (block.blockType === BlockType.MAP) {
			activeMapBlock = block;
		}
	}

	return { activeBlockDepths, activeLoopBlocks, activeMapBlock };
}

/**
 * Creates a compilation context with namespace defaults and derived block-state caches.
 *
 * @param overrides - overrides value to use.
 * @returns Created compilation context.
 */
export function createCompilationContext<TContext extends CompilationContext = CompilationContext>(
	overrides: CompilationContextOverrides<TContext> = {}
): TContext {
	const base: CompilationContext = {
		namespace: {
			namespaces: {},
			memory: {},
			moduleName: undefined,
			prototypeShapeIds: [],
		},
		locals: {},
		byteCode: [],
		stack: [],
		blockStack: [],
		activeBlockDepths: createEmptyBlockDepths(),
		activeLoopBlocks: [],
		activeMapBlock: undefined,
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
		expandPrototypeShapes: false,
	};

	const context = {
		...base,
		...overrides,
		namespace: {
			...base.namespace,
			...overrides.namespace,
		},
	};
	const blockState = getBlockState(context.blockStack);
	const activeBlockDepths = overrides.activeBlockDepths ?? blockState.activeBlockDepths;
	const activeLoopBlocks = overrides.activeLoopBlocks ?? blockState.activeLoopBlocks;
	const activeMapBlock = overrides.activeMapBlock ?? blockState.activeMapBlock;

	return {
		...context,
		activeBlockDepths,
		activeLoopBlocks,
		activeMapBlock,
		insideModuleBlock: overrides.insideModuleBlock ?? activeBlockDepths[BlockType.MODULE] > 0,
		insideFunctionBlock: overrides.insideFunctionBlock ?? activeBlockDepths[BlockType.FUNCTION] > 0,
		insideGenericBlock: overrides.insideGenericBlock ?? activeBlockDepths[BlockType.BLOCK] > 0,
		insideLoopBlock: overrides.insideLoopBlock ?? activeBlockDepths[BlockType.LOOP] > 0,
		insideConditionBlock: overrides.insideConditionBlock ?? activeBlockDepths[BlockType.CONDITION] > 0,
		insideConstantsBlock: overrides.insideConstantsBlock ?? activeBlockDepths[BlockType.CONSTANTS] > 0,
		insideMapBlock: overrides.insideMapBlock ?? activeBlockDepths[BlockType.MAP] > 0,
	} as TContext;
}
