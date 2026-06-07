import type { CompileInput, CompilerDiagnostic, Module } from '@8f4e/compiler-spec';
import { documentBlockInstructionByType, WASM_MEMORY_PAGE_SIZE } from '@8f4e/compiler-spec';
import type { CodeBlockGraphicData, InfoRecord, State } from '@8f4e/editor-state-types';
import type { StateManager } from '@8f4e/state-manager';
import { isCompilableBlockType } from '@8f4e/tokenizer';
import debounceTrailing from '../../pureHelpers/debounceTrailing';
import sortCodeBlocksByGridPosition from '../code-blocks/sortCodeBlocksByGridPosition';
import { log } from '../logger/logger';
import { DEFAULT_RECOMPILE_DEBOUNCE_DELAY, registerRecompileDebounceDelayEditorConfigValidator } from './editorConfig';

const moduleBlockType = documentBlockInstructionByType.module.type;
const constantsBlockType = documentBlockInstructionByType.constants.type;
const functionBlockType = documentBlockInstructionByType.function.type;
const macroBlockType = documentBlockInstructionByType.macro.type;
const prototypeBlockType = documentBlockInstructionByType.prototype.type;

function toCompilerModule(block: CodeBlockGraphicData): Module {
	return {
		code: block.code,
		projectBlockId: block.creationIndex,
	};
}

/**
 * Converts code blocks into compiler input entries plus shared functions, constants, and macros.
 *
 * @param codeBlocks - List of code blocks to filter and sort
 * @returns Compiler input with main-entry modules sorted by grid position,
 *          and constants/functions/macros sorted by creationIndex.
 *          Config/shader/unknown blocks are excluded from the WASM compilation pipeline.
 */
export function flattenProjectForCompiler(codeBlocks: CodeBlockGraphicData[]): CompileInput {
	const moduleEntries: Record<string, CodeBlockGraphicData[]> = {};
	const constants: Module[] = [];
	const functions: Module[] = [];
	const prototypes: Module[] = [];
	const macros: Module[] = [];

	const sortedEnabled = [...codeBlocks]
		.filter(block => !block.disabled)
		.sort((a, b) => a.creationIndex - b.creationIndex);

	for (const block of sortedEnabled) {
		if (block.blockType === moduleBlockType) {
			if (!block.entry) {
				throw new Error(`Module code block "${block.name}" is missing entry`);
			}
			const entryName = block.entry;
			moduleEntries[entryName] ??= [];
			moduleEntries[entryName].push(block);
		} else if (block.blockType === constantsBlockType) {
			constants.push(toCompilerModule(block));
		} else if (block.blockType === functionBlockType) {
			functions.push(toCompilerModule(block));
		} else if (block.blockType === prototypeBlockType) {
			prototypes.push(toCompilerModule(block));
		} else if (block.blockType === macroBlockType) {
			macros.push(toCompilerModule(block));
		}
	}

	const entries = Object.fromEntries(
		Object.entries(moduleEntries).map(([entryName, modules]) => [
			entryName,
			sortCodeBlocksByGridPosition(modules).map(toCompilerModule),
		])
	);
	entries.main ??= [];

	return { entries, constants, functions, prototypes, macros };
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

		const compilerInput = flattenProjectForCompiler(state.codeBlockRendering.codeBlocks);
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

			const result = await state.callbacks.compileCode(compilerInput, compilerOptions);
			const compilationTimeMs = performance.now() - compilationStart;
			const memoryUsagePercent =
				result.allocatedMemoryBytes === 0
					? 0
					: Math.round((result.requiredMemoryBytes / result.allocatedMemoryBytes) * 100);
			const memoryReinitialized = result.memoryAction.action === 'recreated';

			store.set('compiler.compiledFunctions', result.compiledFunctions);
			store.set('compiler.compiledModules', result.compiledModules);
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
			const diagnostic = error as CompilerDiagnostic;

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

		if (!isCompilableBlockType(state.codeBlockRendering.selectedCodeBlock?.blockType)) {
			return;
		}
		scheduleRecompile();
	});
	store.subscribe('codeBlockRendering.selectedCodeBlockForProgrammaticEdit.code', () => {
		if (!isCompilableBlockType(state.codeBlockRendering.selectedCodeBlockForProgrammaticEdit?.blockType)) {
			return;
		}
		scheduleRecompile();
	});
	store.subscribe('featureFlags.codeLineSelection', scheduleRecompile);
}
