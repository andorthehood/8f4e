import type { CodeBlockGraphicData, InfoRecord, State } from '@8f4e/editor-state-types';
import type { CompilerDiagnostic } from '@8f4e/language-spec';
import { documentBlockInstructionByType, WASM_MEMORY_PAGE_SIZE } from '@8f4e/language-spec';
import type { StateManager } from '@8f4e/state-manager';
import { isCompilableBlockType } from '@8f4e/tokenizer';
import debounceTrailing from '../../pureHelpers/debounceTrailing';
import { parseBlockDirectives } from '../code-blocks/utils/parseBlockDirectives';
import { log } from '../logger/logger';
import convertGraphicDataToProjectStructure from '../project-export/serializeCodeBlocks';
import { DEFAULT_RECOMPILE_DEBOUNCE_DELAY, registerRecompileDebounceDelayEditorConfigValidator } from './editorConfig';

const includesBlockType = documentBlockInstructionByType.includes.type;

function hasDebugDirective(codeBlocks: CodeBlockGraphicData[]): boolean {
	return codeBlocks.some(
		codeBlock =>
			parseBlockDirectives(codeBlock.code).some(directive => directive.name === 'debug') ||
			(codeBlock.nestedProjectCodeBlocks !== undefined && hasDebugDirective(codeBlock.nestedProjectCodeBlocks))
	);
}

export default function compiler(store: StateManager<State>): () => void {
	const state = store.getState();
	registerRecompileDebounceDelayEditorConfigValidator(store);
	let disposed = false;

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
		if (disposed) {
			return;
		}

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
				includeStackAnalysis:
					state.featureFlags.codeLineSelection || hasDebugDirective(state.codeBlockRendering.rootCodeBlocks),
			};
			const project = convertGraphicDataToProjectStructure(state.codeBlockRendering.rootCodeBlocks);
			const result = await state.callbacks.compileCode(project, {
				...compilerOptions,
				...(state.callbacks.resolveInclude ? { resolveInclude: state.callbacks.resolveInclude } : {}),
			});
			if (disposed) {
				return;
			}
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
			store.set('compiler.projectMemoryExposuresByGroupPath', result.projectMemoryExposuresByGroupPath);
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
			if (disposed) {
				return;
			}

			log(state, 'Compilation failed', 'Compiler');

			store.set('compiler.isCompiling', false);
			setCompilerInfo({ isCompiling: false });
			const diagnostic = error as CompilerDiagnostic;

			store.set('codeErrors.compilationErrors', [
				{
					lineNumber: diagnostic.line.lineNumber,
					codeBlockId: diagnostic.context.projectBlockId ?? -1,
					codeBlockType: diagnostic.context.codeBlockType,
					...(diagnostic.context.projectGroupPath !== undefined
						? { projectGroupPath: diagnostic.context.projectGroupPath }
						: {}),
					message: diagnostic?.message || String(error) || 'Compilation failed',
				},
			]);
		}
	}

	function onRecompile() {
		if (disposed) {
			return;
		}

		store.set('codeErrors.compilationErrors', []);

		if (!state.callbacks.compileCode) {
			return;
		}

		onForceCompile();
	}

	const onSelectedCodeChanged = () => {
		if (state.codeBlockRendering.selectedCodeBlock?.disabled) {
			return;
		}

		const blockType = state.codeBlockRendering.selectedCodeBlock?.blockType;
		const isProjectGroup = state.codeBlockRendering.selectedCodeBlock?.nestedProjectCodeBlocks !== undefined;
		if (!isProjectGroup && !isCompilableBlockType(blockType) && blockType !== includesBlockType) {
			return;
		}
		scheduleRecompile();
	};
	const onProgrammaticCodeChanged = () => {
		const blockType = state.codeBlockRendering.selectedCodeBlockForProgrammaticEdit?.blockType;
		if (!isCompilableBlockType(blockType) && blockType !== includesBlockType) {
			return;
		}
		scheduleRecompile();
	};

	store.subscribe('codeBlockRendering.selectedCodeBlock.code', onSelectedCodeChanged);
	store.subscribe('codeBlockRendering.selectedCodeBlockForProgrammaticEdit.code', onProgrammaticCodeChanged);
	store.subscribe('featureFlags.codeLineSelection', scheduleRecompile);

	return () => {
		disposed = true;
		scheduleRecompile.cancel();
		store.unsubscribe('codeBlockRendering.selectedCodeBlock.code', onSelectedCodeChanged);
		store.unsubscribe('codeBlockRendering.selectedCodeBlockForProgrammaticEdit.code', onProgrammaticCodeChanged);
		store.unsubscribe('featureFlags.codeLineSelection', scheduleRecompile);
	};
}
