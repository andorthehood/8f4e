import { State } from '../types';
import { EventDispatcher } from '../../events';

export default async function compiler(state: State, events: EventDispatcher) {
	const workerUrl = new URL('../../../../../packages/worker/src/index.ts', import.meta.url);

	const worker = new Worker(workerUrl, {
		type: 'module',
	});

	async function onRecompile() {
		if (!state.compiler.memoryRef) {
			return;
		}
		worker.postMessage({
			memoryRef: state.compiler.memoryRef,
			modules: Array.from(state.graphicHelper.modules).map(module => {
				return { code: module.code };
			}),
			compiledModules: state.compiler.compiledModules,
			compilerOptions: state.compiler.compilerOptions,
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
	events.on('deleteConnection', onRecompile);
	events.on('addModule', onRecompile);
	events.on('deleteModule', onRecompile);
	events.on('init', onRecompile);
	events.on('codeChange', onRecompile);
}
