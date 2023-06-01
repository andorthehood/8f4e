import { State } from '../types';
import { EventDispatcher } from '../../events';

export default async function compiler(state: State, events: EventDispatcher) {
	const workerUrl = new URL('../../../../../packages/worker/src/index.ts', import.meta.url);

	const worker = new Worker(workerUrl, {
		type: 'module',
	});

	function onMidiMessage(data) {
		worker.postMessage({
			type: 'midimessage',
			payload: data,
		});
	}

	async function onRecompile() {
		if (!state.compiler.memoryRef) {
			return;
		}

		worker.postMessage({
			type: 'recompile',
			payload: {
				memoryRef: state.compiler.memoryRef,
				modules: Array.from(state.graphicHelper.modules).map(module => {
					return { code: module.code };
				}),
				compilerOptions: {
					...state.compiler.compilerOptions,
					constants: {
						...state.compiler.compilerOptions.constants,
						SAMPLE_RATE: { value: state.project.sampleRate, isInteger: true },
						AUDIO_BUFFER_SIZE: { value: 128, isInteger: true },
						LEFT_CHANNEL: { value: 0, isInteger: true },
						RIGHT_CHANNEL: { value: 1, isInteger: true },
					},
				},
			},
		});
	}

	async function onWorkerMessage({ data }) {
		switch (data.type) {
			case 'midiMessage':
				events.dispatch('sendMidiMessage', data.payload);
				break;
			case 'RNBOMessage':
				events.dispatch('RNBOMessage', data.payload);
				break;
			case 'buildOk':
				state.compiler.compiledModules = data.payload.compiledModules;
				state.compiler.codeBuffer = data.payload.codeBuffer;
				state.compiler.memoryBuffer = new Int32Array(state.compiler.memoryRef.buffer);
				state.compiler.memoryBufferFloat = new Float32Array(state.compiler.memoryRef.buffer);
				state.compiler.isCompiling = false;
				state.compiler.compilationTime = (performance.now() - state.compiler.lastCompilationStart).toFixed(2);

				state.compiler.buildErrors = [];
				events.dispatch('buildOk');
				break;
			case 'buildError':
				state.compiler.buildErrors = [
					{
						lineNumber: data.payload.line.lineNumber,
						moduleId: data.payload.context.namespace.moduleName,
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
	events.on('midiMessage', onMidiMessage);
}
