import { State } from '../types';
import { compilationDone, recompile } from '../mutators/compiler';

export default function compiler(state: State, events): void {
	const worker = new Worker(new URL('../../../packages/worker/src/index.ts', import.meta.url));
	// @ts-ignore shared: true
	const memoryRef = new WebAssembly.Memory({ initial: 1, maximum: 1, shared: true });

	async function onRecompile() {
		worker.postMessage({ memoryRef, modules: state.modules, connections: state.connections });
		recompile(state);
	}

	async function onWorkerMessage({ data }) {
		switch (data.type) {
			case 'midiMessage':
				events.dispatch('sendMidiMessage', data.payload);
				break;
			case 'compilationDone':
				compilationDone(state, data, memoryRef);
				state.modules.forEach(({ type }, index) => {
					if (state.moduleTypes[type].insertState) {
						state.moduleTypes[type].insertState(
							state.modules[index].state,
							state.compiler.memoryBuffer,
							state.compiler.memoryAddressLookup[state.modules[index].id]
						);
					}
				});
				break;
		}
	}

	worker.addEventListener('message', onWorkerMessage);
	events.on('createConnection', onRecompile);
	events.on('deleteConnection', onRecompile);
	events.on('addModule', onRecompile);
	events.on('deleteModule', onRecompile);
	events.on('init', onRecompile);
}
