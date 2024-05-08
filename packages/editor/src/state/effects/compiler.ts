import { CodeBlockGraphicData, State } from '../types';
import { EventDispatcher } from '../../events';

function flattenProjectForCompiler(codeBlocks: Set<CodeBlockGraphicData>): { code: string[] }[] {
	const flatCodeBlocks: { code: string[] }[] = [];

	function walk(codeBlocks: Set<CodeBlockGraphicData>) {
		codeBlocks.forEach(codeBlock => {
			flatCodeBlocks.push(codeBlock);
			if (codeBlock.codeBlocks && codeBlock.codeBlocks.size > 0) {
				walk(codeBlock.codeBlocks);
				console.log('he');
			}
		});
	}
	walk(codeBlocks);

	return flatCodeBlocks;
}

export default async function compiler(state: State, events: EventDispatcher) {
	const workerUrl = new URL('../../../../../packages/compiler-worker/src/index.ts', import.meta.url);

	const worker = new Worker(workerUrl, {
		type: 'module',
	});

	async function onRecompile() {
		if (!state.compiler.memoryRef) {
			return;
		}

		// TODO: make it recursive
		const modules = flattenProjectForCompiler(state.graphicHelper.baseCodeBlock.codeBlocks);

		worker.postMessage({
			type: 'recompile',
			payload: {
				memoryRef: state.compiler.memoryRef,
				modules,
				compilerOptions: {
					...state.compiler.compilerOptions,
					environmentExtensions: {
						...state.compiler.compilerOptions.environmentExtensions,
						constants: {
							...state.compiler.compilerOptions.environmentExtensions.constants,
							SAMPLE_RATE: { value: state.project.sampleRate, isInteger: true },
							AUDIO_BUFFER_SIZE: { value: 128, isInteger: true },
							LEFT_CHANNEL: { value: 0, isInteger: true },
							RIGHT_CHANNEL: { value: 1, isInteger: true },
						},
					},
				},
			},
		});
	}

	async function onWorkerMessage({ data }) {
		switch (data.type) {
			case 'buildOk':
				state.compiler.compiledModules = data.payload.compiledModules;
				state.compiler.codeBuffer = data.payload.codeBuffer;
				state.compiler.memoryBuffer = new Int32Array(state.compiler.memoryRef.buffer);
				state.compiler.memoryBufferFloat = new Float32Array(state.compiler.memoryRef.buffer);
				state.compiler.isCompiling = false;
				state.compiler.compilationTime = (performance.now() - state.compiler.lastCompilationStart).toFixed(2);

				state.compiler.buildErrors = [];

				state.project.binaryAssets.forEach(binaryAsset => {
					if (binaryAsset.moduleId && binaryAsset.memoryId) {
						const memoryAssignedToBinaryAsset = state.compiler.compiledModules
							.get(binaryAsset.moduleId)
							?.memoryMap.get(binaryAsset.memoryId);

						if (!memoryAssignedToBinaryAsset) {
							return;
						}

						const memoryBuffer = new Uint8Array(state.compiler.memoryRef.buffer);
						const binaryAssetDataBuffer = Buffer.from(binaryAsset.data, 'base64');

						memoryBuffer.set(binaryAssetDataBuffer, memoryAssignedToBinaryAsset.byteAddress);
					}
				});

				if (state.project.sampleRate <= 1000) {
					events.dispatch('initRuntime:WebWorker');
				} else {
					events.dispatch('initRuntime:AudioWorklet');
				}

				break;
			case 'buildError':
				state.compiler.buildErrors = [
					{
						lineNumber: data.payload?.line?.lineNumber || 1,
						moduleId: data.payload?.context?.namespace?.moduleName || '',
						code: data.payload.errorCodadde,
						message: data.payload.message,
					},
				];
				events.dispatch('buildError');
				break;
		}
	}

	worker.addEventListener('message', onWorkerMessage);
	events.on('createConnection', onRecompile);
	events.on('codeBlockAdded', onRecompile);
	events.on('deleteCodeBlock', onRecompile);
	events.on('init', onRecompile);
	events.on('codeChange', onRecompile);
}
