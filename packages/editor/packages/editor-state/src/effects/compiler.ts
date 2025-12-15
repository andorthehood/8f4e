import { StateManager } from '@8f4e/state-manager';

import { EventDispatcher } from '../types';
import { log } from '../impureHelpers/logger';

import type { CodeBlockGraphicData, State } from '../types';

/**
 * Converts code blocks from a Set to separate arrays for modules and functions, sorted by creationIndex.
 *
 * @param codeBlocks - Set of code blocks to filter and sort
 * @returns Object containing modules and functions arrays, each sorted by creationIndex.
 *          Config blocks are excluded from the WASM compilation pipeline.
 */
export function flattenProjectForCompiler(codeBlocks: Set<CodeBlockGraphicData>): {
	modules: { code: string[] }[];
	functions: { code: string[] }[];
} {
	const allBlocks = Array.from(codeBlocks).sort((a, b) => a.creationIndex - b.creationIndex);

	return {
		modules: allBlocks.filter(block => block.blockType === 'module'),
		functions: allBlocks.filter(block => block.blockType === 'function'),
	};
}

export default async function compiler(store: StateManager<State>, events: EventDispatcher) {
	const state = store.getState();
	async function onRecompile() {
		// Check if project has pre-compiled WASM already loaded (runtime-ready project)
		// If codeBuffer is populated and we don't have a compiler, skip compilation
		if (state.compiler.codeBuffer.length > 0 && !state.callbacks.compileProject) {
			log(state, 'Using pre-compiled WASM from runtime-ready project', 'Compiler');
			store.set('compiler.isCompiling', false);
			store.set('codeErrors.compilationErrors', []);
			return;
		}

		const { modules, functions } = flattenProjectForCompiler(state.graphicHelper.codeBlocks);

		store.set('compiler.isCompiling', true);
		store.set('codeErrors.lastCompilationStart', performance.now());

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

			const result = await state.callbacks.compileProject?.(modules, compilerOptions, functions);

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
			state.compiler.isCompiling = false;
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

	events.on('codeBlockAdded', onRecompile);
	events.on('deleteCodeBlock', onRecompile);
	store.subscribe('compiler.compilerOptions', onRecompile);
	store.subscribe('graphicHelper.selectedCodeBlock.code', () => {
		if (state.graphicHelper.selectedCodeBlock?.blockType !== 'module') {
			return;
		}
		onRecompile();
	});
}
