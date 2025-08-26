import { Buffer } from 'buffer';

import { CodeBlockGraphicData, State } from '../types';
import { EventDispatcher } from '../../events';

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

		// TODO: make it recursive
		const modules = flattenProjectForCompiler(state.graphicHelper.baseCodeBlock.codeBlocks);

		state.compiler.isCompiling = true;
		state.compiler.lastCompilationStart = performance.now();

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

		try {
			// Call the external compile callback
			const compilationResult = await state.options.compileProject(
				{
					...state.project,
					codeBlocks: modules.map(module => ({
						code: module.code,
						isOpen: false,
						x: 0,
						y: 0,
					})),
				},
				compilerOptions
			);

			// Handle successful compilation
			state.compiler.compiledModules = compilationResult.compiledModules;
			state.compiler.codeBuffer = compilationResult.codeBuffer;
			state.compiler.allocatedMemorySize = compilationResult.allocatedMemorySize;
			state.compiler.memoryRef = compilationResult.memoryRef;
			state.compiler.memoryBuffer = new Int32Array(state.compiler.memoryRef.buffer);
			state.compiler.memoryBufferFloat = new Float32Array(state.compiler.memoryRef.buffer);
			state.compiler.isCompiling = false;
			state.compiler.compilationTime = performance.now() - state.compiler.lastCompilationStart;

			state.compiler.buildErrors = compilationResult.buildErrors;

			// Handle binary assets
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
					const binaryAssetDataBuffer = Uint8Array.from(Buffer.from(binaryAsset.data, 'base64')).slice(
						0,
						allocatedSizeInBytes
					);

					memoryBuffer.set(binaryAssetDataBuffer, memoryAssignedToBinaryAsset.byteAddress);
				}
			});

			events.dispatch('buildFinished');
		} catch (error) {
			// Handle compilation error
			state.compiler.isCompiling = false;
			
			// Cast error to any for property access, since compiler errors can have various shapes
			const compilationError = error as any;
			
			state.compiler.buildErrors = [
				{
					lineNumber: compilationError?.line?.lineNumber || 1,
					moduleId: compilationError?.context?.namespace?.moduleName || '',
					code: compilationError?.code || 0,
					message: compilationError?.message || 'Compilation failed',
				},
			];
			events.dispatch('buildError');
		}
	}

	events.on('createConnection', onRecompile);
	events.on('codeBlockAdded', onRecompile);
	events.on('deleteCodeBlock', onRecompile);
	events.on('init', onRecompile);
	events.on('codeChange', onRecompile);
}
