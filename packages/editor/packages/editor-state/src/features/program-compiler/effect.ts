import type { CodeBlockGraphicData, InfoRecord, State } from '@8f4e/editor-state-types';
import { IncludeResolutionError, resolveIncludeSourceTreeAsync } from '@8f4e/include-resolver';
import type { CompilerDiagnostic } from '@8f4e/language-spec';
import { documentBlockInstructionByType, ErrorCode, WASM_MEMORY_PAGE_SIZE } from '@8f4e/language-spec';
import {
	IncludeFunctionError,
	type ProjectBlock,
	prepareCompilerInputFromProjectBlocksWithIncludeSourceTreeAsync,
} from '@8f4e/project-preparser';
import type { StateManager } from '@8f4e/state-manager';
import { isCompilableBlockType } from '@8f4e/tokenizer';
import debounceTrailing from '../../pureHelpers/debounceTrailing';
import sortCodeBlocksByGridPosition from '../code-blocks/sortCodeBlocksByGridPosition';
import { log } from '../logger/logger';
import { DEFAULT_RECOMPILE_DEBOUNCE_DELAY, registerRecompileDebounceDelayEditorConfigValidator } from './editorConfig';

const includesBlockType = documentBlockInstructionByType.includes.type;

function toProjectBlock(block: CodeBlockGraphicData): ProjectBlock {
	return {
		id: block.creationIndex,
		code: block.code,
		disabled: block.disabled,
		entry: block.entry,
	};
}

/**
 * Converts editor code blocks into plain project blocks in editor execution order.
 *
 * Compiler-facing classification belongs to @8f4e/project-preparser; the editor
 * only supplies source blocks in the order it wants the preparer to preserve.
 */
export function toOrderedProjectBlocksForCompiler(codeBlocks: CodeBlockGraphicData[]): ProjectBlock[] {
	return sortCodeBlocksByGridPosition(codeBlocks).map(toProjectBlock);
}

function createIncludeResolutionSourceFromCodeBlocks(blocks: readonly CodeBlockGraphicData[]): {
	source: string;
	projectBlockIdByLineNumber: ReadonlyMap<number, number>;
} {
	const lines: string[] = [];
	const projectBlockIdByLineNumber = new Map<number, number>();

	for (const block of blocks) {
		if (block.disabled || block.blockType !== includesBlockType) {
			continue;
		}
		if (lines.length > 0) {
			lines.push('');
		}
		for (const line of block.code) {
			lines.push(line);
			projectBlockIdByLineNumber.set(lines.length, block.creationIndex);
		}
	}

	return {
		source: lines.join('\n'),
		projectBlockIdByLineNumber,
	};
}

function createIncludesDiagnostic(
	error: IncludeResolutionError | IncludeFunctionError,
	projectBlockId?: number
): CompilerDiagnostic {
	return {
		code: ErrorCode.UNKNOWN_ERROR,
		message: error.message,
		line: { lineNumber: error.lineNumber },
		context: {
			projectBlockId,
		},
	};
}

export default function compiler(store: StateManager<State>) {
	const state = store.getState();
	registerRecompileDebounceDelayEditorConfigValidator(store);

	const scheduleRecompile = debounceTrailing(
		onRecompile,
		() => state.editorConfig.recompileDebounceDelay ?? DEFAULT_RECOMPILE_DEBOUNCE_DELAY
	);

	function setCompilerInfo(partial: InfoRecord): void {
		store.set('info.compiler', {
			...(state.info.compiler ?? {}),
			...partial,
		});
	}

	async function onForceCompile() {
		scheduleRecompile.cancel();
		const compilationStart = performance.now();

		store.set('compiler.isCompiling', true);
		setCompilerInfo({ isCompiling: true });

		try {
			if (!state.callbacks.compileCode) {
				store.set('compiler.isCompiling', false);
				setCompilerInfo({ isCompiling: false });
				return;
			}

			const compilerOptions = {
				startingMemoryWordAddress: 0,
				includeStackAnalysis: state.featureFlags.codeLineSelection,
			};
			const orderedCodeBlocks = sortCodeBlocksByGridPosition(state.codeBlockRendering.codeBlocks);
			const projectBlocks = orderedCodeBlocks.map(toProjectBlock);
			const includeResolutionSource = createIncludeResolutionSourceFromCodeBlocks(orderedCodeBlocks);
			const includeSourceTree = await resolveIncludeSourceTreeAsync(
				includeResolutionSource.source,
				state.callbacks.resolveInclude ?? (() => undefined)
			);
			const compilerInput = await prepareCompilerInputFromProjectBlocksWithIncludeSourceTreeAsync(
				projectBlocks,
				includeSourceTree
			);

			const result = await state.callbacks.compileCode(compilerInput, compilerOptions);
			const compilationTimeMs = performance.now() - compilationStart;
			const memoryUsagePercent =
				result.allocatedMemoryBytes === 0
					? 0
					: Math.round((result.requiredMemoryBytes / result.allocatedMemoryBytes) * 100);
			const memoryReinitialized = result.memoryAction.action === 'recreated';

			store.set('compiler.compiledFunctions', result.compiledFunctions);
			store.set('compiler.compiledModules', result.compiledModules);
			store.set('compiler.memoryPlan', result.memoryPlan);
			store.set('compiler.memoryDefaultsByModuleId', result.memoryDefaultsByModuleId);
			store.set('compiler.pointerMetadataByModuleId', result.pointerMetadataByModuleId);
			store.set('compiler.isCompiling', false);
			setCompilerInfo({
				isCompiling: false,
				compilationTimeMs,
				wasmByteCodeBytes: result.byteCodeSize,
				requiredMemoryBytes: result.requiredMemoryBytes,
				allocatedMemoryBytes: result.allocatedMemoryBytes,
				allocatedPages: result.allocatedMemoryBytes / WASM_MEMORY_PAGE_SIZE,
				memoryUsagePercent,
				astCacheHits: result.astCacheStats.hits,
				astCacheMisses: result.astCacheStats.misses,
				memoryReinitialized,
			});
			store.set('codeErrors.compilationErrors', []);

			if (memoryReinitialized) {
				log(state, 'WASM Memory instance was (re)created', 'Compiler');
				log(state, 'Memory was (re)initialized', 'Compiler');
			}

			log(state, 'Compilation succeeded in ' + compilationTimeMs.toFixed(2) + 'ms', 'Compiler');
			console.log('[Compiler] Compilation succeeded with config:', compilerOptions);
		} catch (error) {
			log(state, 'Compilation failed', 'Compiler');

			store.set('compiler.isCompiling', false);
			setCompilerInfo({ isCompiling: false });
			const diagnostic =
				error instanceof IncludeResolutionError
					? createIncludesDiagnostic(
							error,
							createIncludeResolutionSourceFromCodeBlocks(
								sortCodeBlocksByGridPosition(state.codeBlockRendering.codeBlocks)
							).projectBlockIdByLineNumber.get(error.lineNumber)
						)
					: error instanceof IncludeFunctionError
						? createIncludesDiagnostic(error)
						: (error as CompilerDiagnostic);

			store.set('codeErrors.compilationErrors', [
				{
					lineNumber: diagnostic.line.lineNumber,
					codeBlockId: diagnostic.context.projectBlockId ?? -1,
					codeBlockType: diagnostic.context.codeBlockType,
					message: diagnostic?.message || String(error) || 'Compilation failed',
				},
			]);
		}
	}

	function onRecompile() {
		store.set('codeErrors.compilationErrors', []);

		if (!state.callbacks.compileCode) {
			return;
		}

		onForceCompile();
	}

	store.subscribe('codeBlockRendering.selectedCodeBlock.code', () => {
		if (state.codeBlockRendering.selectedCodeBlock?.disabled) {
			return;
		}

		const blockType = state.codeBlockRendering.selectedCodeBlock?.blockType;
		if (!isCompilableBlockType(blockType) && blockType !== includesBlockType) {
			return;
		}
		scheduleRecompile();
	});
	store.subscribe('codeBlockRendering.selectedCodeBlockForProgrammaticEdit.code', () => {
		const blockType = state.codeBlockRendering.selectedCodeBlockForProgrammaticEdit?.blockType;
		if (!isCompilableBlockType(blockType) && blockType !== includesBlockType) {
			return;
		}
		scheduleRecompile();
	});
	store.subscribe('featureFlags.codeLineSelection', scheduleRecompile);
}
