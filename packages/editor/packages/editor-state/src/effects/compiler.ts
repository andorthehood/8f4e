import { StateManager } from '@8f4e/state-manager';

import { decodeBase64ToUint8Array } from '../helpers/base64Decoder';
import { EventDispatcher } from '../types';

import type { CodeBlockGraphicData, State } from '../types';

function flattenProjectForCompiler(codeBlocks: Set<CodeBlockGraphicData>): { code: string[] }[] {
	const flatCodeBlocks: { code: string[] }[] = [];

	function walk(codeBlocks: Set<CodeBlockGraphicData>) {
		codeBlocks.forEach(codeBlock => {
			flatCodeBlocks.push(codeBlock);
			if (codeBlock.codeBlocks && codeBlock.codeBlocks.size > 0) {
				walk(codeBlock.codeBlocks);
			}
		});
	}
	walk(codeBlocks);

	return flatCodeBlocks;
}

export default async function compiler(store: StateManager<State>, events: EventDispatcher) {
	const state = store.getState();
	async function onRecompile() {
		// Check if project has pre-compiled WASM already loaded (runtime-ready project)
		// If codeBuffer is populated and we don't have a compiler, skip compilation
		if (state.compiler.codeBuffer.length > 0 && !state.callbacks.compileProject) {
			console.log('[Compiler] Using pre-compiled WASM from runtime-ready project');
			state.compiler.isCompiling = false;
			state.compiler.buildErrors = [];
			events.dispatch('buildFinished');
			return;
		}

		// Regular compilation path
		const modules = flattenProjectForCompiler(state.graphicHelper.activeViewport.codeBlocks);

		state.compiler.isCompiling = true;
		state.compiler.lastCompilationStart = performance.now();

		try {
			const compilerOptions = {
				...state.compiler.compilerOptions,
				environmentExtensions: {
					...state.compiler.compilerOptions.environmentExtensions,
					constants: {
						...state.compiler.compilerOptions.environmentExtensions.constants,
						SAMPLE_RATE: {
							value: state.compiler.runtimeSettings[state.compiler.selectedRuntime].sampleRate,
							isInteger: true,
						},
						AUDIO_BUFFER_SIZE: { value: 128, isInteger: true },
						LEFT_CHANNEL: { value: 0, isInteger: true },
						RIGHT_CHANNEL: { value: 1, isInteger: true },
					},
				},
			};

			const result = await state.callbacks.compileProject?.(modules, compilerOptions);

			if (!result) {
				return;
			}

			// Handle successful compilation
			state.compiler.compiledModules = result.compiledModules;
			state.compiler.codeBuffer = result.codeBuffer;
			state.compiler.allocatedMemorySize = result.allocatedMemorySize;
			state.compiler.memoryBuffer = result.memoryBuffer;
			state.compiler.memoryBufferFloat = result.memoryBufferFloat;
			state.compiler.isCompiling = false;
			state.compiler.compilationTime = performance.now() - state.compiler.lastCompilationStart;

			state.compiler.buildErrors = [];

			state.compiler.binaryAssets.forEach(binaryAsset => {
				if (binaryAsset.moduleId && binaryAsset.memoryId) {
					const memoryAssignedToBinaryAsset =
						state.compiler.compiledModules[binaryAsset.moduleId]?.memoryMap[binaryAsset.memoryId];

					if (!memoryAssignedToBinaryAsset) {
						return;
					}

					const allocatedSizeInBytes =
						memoryAssignedToBinaryAsset.numberOfElements * memoryAssignedToBinaryAsset.elementWordSize;
					const memoryBuffer = new Uint8Array(state.compiler.memoryBuffer.buffer);
					const binaryAssetDataBuffer = decodeBase64ToUint8Array(binaryAsset.data).slice(0, allocatedSizeInBytes);

					memoryBuffer.set(binaryAssetDataBuffer, memoryAssignedToBinaryAsset.byteAddress);
				}
			});

			events.dispatch('buildFinished');
		} catch (error) {
			// Handle compilation error
			state.compiler.isCompiling = false;
			const errorObject = error as Error & {
				line?: { lineNumber: number };
				context?: { namespace?: { moduleName: string } };
				errorCode?: number;
			};
			state.compiler.buildErrors = [
				{
					lineNumber: errorObject?.line?.lineNumber || 1,
					moduleId: errorObject?.context?.namespace?.moduleName || '',
					code: errorObject?.errorCode || 0,
					message: errorObject?.message || error?.toString() || 'Compilation failed',
				},
			];
			events.dispatch('buildError');
		}
	}

	events.on('createConnection', onRecompile);
	events.on('codeBlockAdded', onRecompile);
	events.on('deleteCodeBlock', onRecompile);
	events.on('projectLoaded', onRecompile);
	store.subscribe('graphicHelper.selectedCodeBlock.code', onRecompile);
}
