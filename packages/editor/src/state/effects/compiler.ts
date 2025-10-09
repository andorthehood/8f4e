import { decodeBase64ToUint8Array } from '../helpers/base64Decoder';
import { EventDispatcher } from '../../events';

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

export default async function compiler(state: State, events: EventDispatcher) {
	async function onRecompile() {
		if (!state.compiler.memoryRef) {
			return;
		}

		// Check if project has pre-compiled WASM bytecode for runtime-only execution
		if (state.project.compiledWasm) {
			console.log('[Compiler] Using pre-compiled WASM bytecode from project');

			try {
				// Decode base64 WASM back to Uint8Array
				const base64Data = state.project.compiledWasm;
				const wasmBytecode = decodeBase64ToUint8Array(base64Data);

				// Set up the compiler state as if compilation succeeded
				state.compiler.codeBuffer = wasmBytecode;
				state.compiler.isCompiling = false;
				state.compiler.buildErrors = [];
				state.compiler.compilationTime = 0; // No compilation time since we used pre-compiled

				// Note: Binary assets are not handled for pre-compiled WASM projects
				// as they should already be embedded in the compiled bytecode.
				// The compiledModules map is not available for pre-compiled projects
				// since it contains compilation-time metadata that is not persisted.

				console.log('[Compiler] Pre-compiled WASM loaded successfully');
				events.dispatch('buildFinished');
				return;
			} catch (error) {
				console.error('[Compiler] Failed to load pre-compiled WASM:', error);
				// Fall through to regular compilation if pre-compiled WASM fails
			}
		}

		// Regular compilation path (when no pre-compiled WASM or if it failed to load)
		// TODO: make it recursive
		const modules = flattenProjectForCompiler(state.graphicHelper.baseCodeBlock.codeBlocks);

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
							value: state.project.runtimeSettings[state.project.selectedRuntime].sampleRate,
							isInteger: true,
						},
						AUDIO_BUFFER_SIZE: { value: 128, isInteger: true },
						LEFT_CHANNEL: { value: 0, isInteger: true },
						RIGHT_CHANNEL: { value: 1, isInteger: true },
					},
				},
			};

			const result = await state.options.callbacks.compileProject(modules, compilerOptions, state.compiler.memoryRef);

			// Handle successful compilation
			state.compiler.compiledModules = result.compiledModules;
			state.compiler.codeBuffer = result.codeBuffer;
			state.compiler.allocatedMemorySize = result.allocatedMemorySize;
			state.compiler.memoryBuffer = new Int32Array(state.compiler.memoryRef.buffer);
			state.compiler.memoryBufferFloat = new Float32Array(state.compiler.memoryRef.buffer);
			state.compiler.isCompiling = false;
			state.compiler.compilationTime = performance.now() - state.compiler.lastCompilationStart;

			state.compiler.buildErrors = [];

			(state.project.binaryAssets || []).forEach(binaryAsset => {
				if (binaryAsset.moduleId && binaryAsset.memoryId) {
					const memoryAssignedToBinaryAsset = state.compiler.compiledModules
						.get(binaryAsset.moduleId)
						?.memoryMap.get(binaryAsset.memoryId);

					if (!memoryAssignedToBinaryAsset) {
						return;
					}

					const allocatedSizeInBytes =
						memoryAssignedToBinaryAsset.numberOfElements * memoryAssignedToBinaryAsset.elementWordSize;
					const memoryBuffer = new Uint8Array(state.compiler.memoryRef.buffer);
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
	events.on('codeChange', onRecompile);
}
