import { StateManager } from '@8f4e/state-manager';

import { EventDispatcher } from '../types';
import { error, log } from '../impureHelpers/logger/logger';

import type { CodeBlockGraphicData, State } from '../types';

/**
 * Converts code blocks into separate arrays for modules and functions, sorted by creationIndex.
 *
 * @param codeBlocks - List of code blocks to filter and sort
 * @returns Object containing modules and functions arrays, each sorted by creationIndex.
 *          Config blocks and comment blocks are excluded from the WASM compilation pipeline.
 *          Constants blocks are included in modules array.
 */
export function flattenProjectForCompiler(codeBlocks: CodeBlockGraphicData[]): {
	modules: { code: string[] }[];
	functions: { code: string[] }[];
} {
	const allBlocks = [...codeBlocks].sort((a, b) => a.creationIndex - b.creationIndex);

	return {
		modules: allBlocks.filter(block => block.blockType === 'module' || block.blockType === 'constants'),
		functions: allBlocks.filter(block => block.blockType === 'function'),
	};
}

export default async function compiler(store: StateManager<State>, events: EventDispatcher) {
	const state = store.getState();

	async function onForceCompile() {
		const { modules, functions } = flattenProjectForCompiler(state.graphicHelper.codeBlocks);

		store.set('compiler.isCompiling', true);
		store.set('compiler.lastCompilationStart', performance.now());

		try {
			const compilerOptions = {
				memorySizeBytes: state.compiledConfig?.memorySizeBytes || 1048576, // 1MB default
				startingMemoryWordAddress: 0,
				environmentExtensions: {
					constants: {
						SAMPLE_RATE: {
							value: state.compiledConfig.runtimeSettings[state.compiledConfig.selectedRuntime].sampleRate,
							isInteger: true,
						},
						AUDIO_BUFFER_SIZE: { value: 128, isInteger: true },
						LEFT_CHANNEL: { value: 0, isInteger: true },
						RIGHT_CHANNEL: { value: 1, isInteger: true },
					},
					ignoredKeywords: ['debug', 'button', 'switch', 'offset', 'plot', 'piano'],
				},
			};

			const result = await state.callbacks.compileCode?.(modules, compilerOptions, functions);

			if (!result) {
				return;
			}

			store.set('compiler.byteCodeSize', result.byteCodeSize);
			store.set('compiler.compiledFunctions', result.compiledFunctions);
			store.set('compiler.compiledModules', result.compiledModules);
			store.set('compiler.allocatedMemorySize', result.allocatedMemorySize);
			store.set('compiler.isCompiling', false);
			store.set('compiler.compilationTime', performance.now() - state.compiler.lastCompilationStart);
			store.set('codeErrors.compilationErrors', []);

			if (result.memoryAction.action === 'recreated') {
				log(state, 'WASM Memory instance was (re)created', 'Compiler');
				log(state, 'Memory was (re)initialized', 'Compiler');
				events.dispatch('loadBinaryFilesIntoMemory');
			}

			log(state, 'Compilation succeeded in ' + state.compiler.compilationTime.toFixed(2) + 'ms', 'Compiler');
			console.log('[Compiler] Compilation succeeded with config:', compilerOptions);
		} catch (error) {
			store.set('compiler.isCompiling', false);
			const errorObject = error as Error & {
				line?: { lineNumber: number };
				context?: { namespace?: { moduleName: string } };
				errorCode?: number;
			};

			store.set('codeErrors.compilationErrors', [
				{
					lineNumber: errorObject?.line?.lineNumber || 1,
					codeBlockId: errorObject?.context?.namespace?.moduleName || '',
					message: errorObject?.message || error?.toString() || 'Compilation failed',
				},
			]);
		}
	}

	function onRecompile() {
		store.set('codeErrors.compilationErrors', []);
		state.binaryAssets = state.initialProjectState?.binaryAssets || [];

		if (
			state.initialProjectState?.memorySnapshot &&
			(state.compiledConfig.disableAutoCompilation || !state.callbacks.compileCode)
		) {
			try {
				// state.compiler.allocatedMemorySize = state.compiler.memoryBuffer.byteLength;
				log(state, 'Memory snapshot loaded and decoded successfully', 'Loader');
			} catch (err) {
				state.compiler.allocatedMemorySize = 0;
				console.error('[Loader] Failed to decode memory snapshot:', err);
				error(state, 'Failed to decode memory snapshot', 'Loader');
			}
		}

		// Check if project has pre-compiled WASM.
		// If auto compilation is disabled or if there is no compilation callback provided then
		// use the pre-compiled code.
		if (
			state.initialProjectState?.compiledWasm &&
			state.initialProjectState.compiledModules &&
			(state.compiledConfig.disableAutoCompilation || !state.callbacks.compileCode)
		) {
			try {
				state.compiler.compiledModules = state.initialProjectState.compiledModules;
				store.set('codeErrors.compilationErrors', []);
				log(state, 'Pre-compiled WASM loaded and decoded successfully', 'Loader');
			} catch (err) {
				state.compiler.compiledModules = {};
				console.error('[Loader] Failed to decode pre-compiled WASM:', err);
				error(state, 'Failed to decode pre-compiled WASM', 'Loader');
			}
			return;
		}

		// Check if compilation is disabled by config
		if (state.compiledConfig.disableAutoCompilation || !state.callbacks.compileCode) {
			log(state, 'Compilation skipped: disableAutoCompilation flag is set', 'Compiler');
			return;
		}

		onForceCompile();
	}

	events.on('compileCode', onForceCompile);
	store.subscribe('compiledConfig', onRecompile);
	store.subscribe('graphicHelper.selectedCodeBlock.code', () => {
		if (
			state.graphicHelper.selectedCodeBlock?.blockType !== 'module' &&
			state.graphicHelper.selectedCodeBlock?.blockType !== 'function'
		) {
			return;
		}
		onRecompile();
	});
}
