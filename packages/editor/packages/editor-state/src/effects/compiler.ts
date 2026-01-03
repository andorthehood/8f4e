import { StateManager } from '@8f4e/state-manager';

import { EventDispatcher } from '../types';
import { log } from '../impureHelpers/logger/logger';

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
				...state.compiler.compilerOptions,
				environmentExtensions: {
					...state.compiler.compilerOptions.environmentExtensions,
					constants: {
						...state.compiler.compilerOptions.environmentExtensions.constants,
						SAMPLE_RATE: {
							value: state.runtime.runtimeSettings[state.runtime.selectedRuntime].sampleRate,
							isInteger: true,
						},
						AUDIO_BUFFER_SIZE: { value: 128, isInteger: true },
						LEFT_CHANNEL: { value: 0, isInteger: true },
						RIGHT_CHANNEL: { value: 1, isInteger: true },
					},
				},
			};

			const result = await state.callbacks.compileCode?.(modules, compilerOptions, functions);

			if (!result) {
				return;
			}

			store.set('compiler.compiledFunctions', result.compiledFunctions);
			store.set('compiler.compiledModules', result.compiledModules);
			store.set('compiler.codeBuffer', result.codeBuffer);
			store.set('compiler.allocatedMemorySize', result.allocatedMemorySize);
			store.set('compiler.memoryBuffer', result.memoryBuffer);
			store.set('compiler.memoryBufferFloat', result.memoryBufferFloat);
			store.set('compiler.isCompiling', false);
			store.set('compiler.compilationTime', performance.now() - state.compiler.lastCompilationStart);
			store.set('codeErrors.compilationErrors', []);

			if (result.memoryAction.action === 'recreated') {
				log(state, 'WASM Memory instance was (re)created', 'Compiler');
				log(state, 'Memory was (re)initialized', 'Compiler');
				events.dispatch('loadBinaryFilesIntoMemory');
			}

			log(state, 'Compilation succeeded in ' + state.compiler.compilationTime.toFixed(2) + 'ms', 'Compiler');
		} catch (error) {
			console.log(error);
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
		// Check if compilation is disabled by config
		if (state.compiler.disableAutoCompilation) {
			log(state, 'Compilation skipped: disableAutoCompilation flag is set', 'Compiler');
			return;
		}

		// Check if project has pre-compiled WASM already loaded (runtime-ready project)
		// If codeBuffer is populated and we don't have a compiler, skip compilation
		if (state.compiler.codeBuffer.length > 0 && !state.callbacks.compileCode) {
			log(state, 'Using pre-compiled WASM from runtime-ready project', 'Compiler');
			store.set('compiler.isCompiling', false);
			store.set('codeErrors.compilationErrors', []);
			return;
		}

		onForceCompile();
	}

	events.on('compileCode', onForceCompile);
	store.subscribe('compiler.compilerOptions', onRecompile);
	store.subscribe('graphicHelper.codeBlocks', () => {
		// state.compiler.compilerOptions.memorySizeBytes = defaultState.compiler.compilerOptions.memorySizeBytes;
		// state.compiler.memoryBuffer = new Int32Array();
		// state.compiler.memoryBufferFloat = new Float32Array();
		// state.compiler.codeBuffer = new Uint8Array();
		// state.compiler.compiledModules = {};
		// state.compiler.allocatedMemorySize = 0;
		// store.set('codeErrors.compilationErrors', []);
		// state.compiler.isCompiling = false;
		// state.binaryAssets = newProject.binaryAssets || [];
		// state.runtime.runtimeSettings = defaultState.runtime.runtimeSettings;
		// state.runtime.selectedRuntime = defaultState.runtime.selectedRuntime;
		// // postProcessEffects are now derived from shader code blocks, not loaded from project data
		// if (newProject.compiledWasm && newProject.memorySnapshot) {
		// 	try {
		// 		state.compiler.codeBuffer = decodeBase64ToUint8Array(newProject.compiledWasm);
		// 		state.compiler.memoryBuffer = decodeBase64ToInt32Array(newProject.memorySnapshot);
		// 		state.compiler.memoryBufferFloat = decodeBase64ToFloat32Array(newProject.memorySnapshot);
		// 		state.compiler.allocatedMemorySize = state.compiler.memoryBuffer.byteLength;
		// 		if (newProject.compiledModules) {
		// 			state.compiler.compiledModules = newProject.compiledModules;
		// 		}
		// 		log(state, 'Pre-compiled WASM loaded and decoded successfully', 'Loader');
		// 	} catch (err) {
		// 		console.error('[Loader] Failed to decode pre-compiled WASM:', err);
		// 		error(state, 'Failed to decode pre-compiled WASM', 'Loader');
		// 		state.compiler.codeBuffer = new Uint8Array();
		// 		state.compiler.memoryBuffer = new Int32Array();
		// 		state.compiler.memoryBufferFloat = new Float32Array();
		// 	}
		// } else if (newProject.compiledModules) {
		// 	state.compiler.compiledModules = newProject.compiledModules;
		// }
	});
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
