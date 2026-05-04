import { StateManager } from '@8f4e/state-manager';
import { isCompilableBlockType } from '@8f4e/tokenizer';

import { DEFAULT_RECOMPILE_DEBOUNCE_DELAY, registerRecompileDebounceDelayEditorConfigValidator } from './editorConfig';

import { log } from '../logger/logger';
import debounceTrailing from '../../pureHelpers/debounceTrailing';

import type { CompilerDiagnostic } from '@8f4e/compiler-types';
import type { CodeBlockGraphicData, State } from '@8f4e/editor-state-types';

/**
 * Converts code blocks into separate arrays for modules, functions, and macros, sorted by creationIndex.
 *
 * @param codeBlocks - List of code blocks to filter and sort
 * @returns Object containing modules, functions, and macros arrays, each sorted by creationIndex.
 *          Config/shader/unknown blocks are excluded from the WASM compilation pipeline.
 *          Constants blocks are included in modules array.
 */
export function flattenProjectForCompiler(codeBlocks: CodeBlockGraphicData[]): {
	modules: { code: string[] }[];
	functions: { code: string[] }[];
	macros: { code: string[] }[];
} {
	const modules: { code: string[] }[] = [];
	const functions: { code: string[] }[] = [];
	const macros: { code: string[] }[] = [];

	const sortedEnabled = [...codeBlocks]
		.filter(block => !block.disabled)
		.sort((a, b) => a.creationIndex - b.creationIndex);

	for (const block of sortedEnabled) {
		if (block.blockType === 'module' || block.blockType === 'constants') {
			modules.push(block);
		} else if (block.blockType === 'function') {
			functions.push(block);
		} else if (block.blockType === 'macro') {
			macros.push(block);
		}
	}

	return { modules, functions, macros };
}

export default function compiler(store: StateManager<State>) {
	const state = store.getState();
	registerRecompileDebounceDelayEditorConfigValidator(store);

	const scheduleRecompile = debounceTrailing(
		onRecompile,
		() => state.editorConfig.recompileDebounceDelay ?? DEFAULT_RECOMPILE_DEBOUNCE_DELAY
	);

	async function onForceCompile() {
		scheduleRecompile.cancel();

		const { modules, functions, macros } = flattenProjectForCompiler(state.graphicHelper.codeBlocks);

		store.set('compiler.isCompiling', true);
		store.set('compiler.lastCompilationStart', performance.now());

		try {
			if (!state.callbacks.compileCode) {
				store.set('compiler.isCompiling', false);
				return;
			}

			const compilerOptions = {
				startingMemoryWordAddress: 0,
			};

			const result = await state.callbacks.compileCode(modules, compilerOptions, functions, macros);

			store.set('compiler.byteCodeSize', result.byteCodeSize);
			store.set('compiler.compiledFunctions', result.compiledFunctions);
			store.set('compiler.compiledModules', result.compiledModules);
			store.set('compiler.requiredMemoryBytes', result.requiredMemoryBytes);
			store.set('compiler.allocatedMemoryBytes', result.allocatedMemoryBytes);
			store.set('compiler.astCacheStats', result.astCacheStats);
			store.set('compiler.isCompiling', false);
			store.set('compiler.compilationTime', performance.now() - state.compiler.lastCompilationStart);
			store.set('codeErrors.compilationErrors', []);

			if (result.memoryAction.action === 'recreated') {
				log(state, 'WASM Memory instance was (re)created', 'Compiler');
				log(state, 'Memory was (re)initialized', 'Compiler');
				store.set('compiler.hasMemoryBeenReinitialized', true);
			} else {
				store.set('compiler.hasMemoryBeenReinitialized', false);
			}

			log(state, 'Compilation succeeded in ' + state.compiler.compilationTime.toFixed(2) + 'ms', 'Compiler');
			console.log('[Compiler] Compilation succeeded with config:', compilerOptions);
		} catch (error) {
			log(state, 'Compilation failed', 'Compiler');

			store.set('compiler.isCompiling', false);
			const diagnostic = error as CompilerDiagnostic;

			store.set('codeErrors.compilationErrors', [
				{
					lineNumber: diagnostic.line.lineNumberBeforeMacroExpansion,
					codeBlockId: diagnostic.context.codeBlockId || '',
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

	store.subscribe('graphicHelper.selectedCodeBlock.code', () => {
		if (state.graphicHelper.selectedCodeBlock?.disabled) {
			return;
		}

		if (!isCompilableBlockType(state.graphicHelper.selectedCodeBlock?.blockType)) {
			return;
		}
		scheduleRecompile();
	});
	store.subscribe('graphicHelper.selectedCodeBlockForProgrammaticEdit.code', () => {
		if (!isCompilableBlockType(state.graphicHelper.selectedCodeBlockForProgrammaticEdit?.blockType)) {
			return;
		}
		scheduleRecompile();
	});
}
