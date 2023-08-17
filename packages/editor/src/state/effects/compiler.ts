import { State } from '../types';
import { EventDispatcher } from '../../events';

export default async function compiler(state: State, events: EventDispatcher) {
	const workerUrl = new URL('../../../../../packages/compiler-worker/src/index.ts', import.meta.url);

	const worker = new Worker(workerUrl, {
		type: 'module',
	});

	async function onRecompile() {
		if (!state.compiler.memoryRef) {
			return;
		}

		const modules = Array.from(state.graphicHelper.modules).map(module => {
			return { code: module.code };
		});

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
				events.dispatch('initRuntime');
				break;
			case 'buildError':
				state.compiler.buildErrors = [
					{
						lineNumber: data.payload.line.lineNumber,
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
	events.on('moduleAdded', onRecompile);
	events.on('deleteModule', onRecompile);
	events.on('init', onRecompile);
	events.on('codeChange', onRecompile);
}
