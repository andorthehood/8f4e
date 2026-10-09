import type { CompilationContext } from '@8f4e/language-spec';
import { createBlockState } from './blockStack';
import { createEmptyMemoryPlan } from './memoryState';

/** Partial context shape used by tests and compiler stages when seeding a compilation context. */
type CompilationContextOverrides<TContext extends CompilationContext = CompilationContext> = Partial<
	Omit<TContext, 'namespace'>
> & {
	namespace?: Partial<TContext['namespace']>;
};

/**
 * Creates semantic compilation state with namespace defaults and derived block tracking.
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
			moduleName: undefined,
			prototypeShapeIds: [],
		},
		locals: {},
		byteCode: [],
		stack: [],
		...createBlockState(),
		startingByteAddress: 0,
		currentModuleNextWordOffset: 0,
		currentModuleWordAlignedSize: 0,
		currentMemoryIndex: 0,
		memoryPlan: createEmptyMemoryPlan(),
		memoryAliases: new Map(),
		memoryDefaults: {},
		pointerMetadata: {},
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
	const blockState = createBlockState(context.blockStack);
	const activeBlockDepths = overrides.activeBlockDepths ?? blockState.activeBlockDepths;
	const activeLoopBlocks = overrides.activeLoopBlocks ?? blockState.activeLoopBlocks;
	const activeMapBlock = overrides.activeMapBlock ?? blockState.activeMapBlock;

	return {
		...context,
		activeBlockDepths,
		activeLoopBlocks,
		activeMapBlock,
	} as TContext;
}
