import { State } from '../types';

export default function compiler(state: State, events) {
	const worker = new Worker(new URL('../../../packages/worker/src/index.ts', import.meta.url));
	// @ts-ignore shared: true
	const memoryRef = new WebAssembly.Memory({ initial: 1, maximum: 1, shared: true });

	async function recompile() {
		worker.postMessage({ memoryRef, modules: state.modules, connections: state.connections });
		state.compiler.isCompiling = true;
		state.compiler.lastCompilationStart = performance.now();
	}

	async function onWorkerMessage({ data }) {
		switch (data.type) {
			case 'midiMessage':
				events.dispatch('sendMidiMessage', data.payload);
				break;
			case 'compilationDone':
				state.compiler.memoryBuffer = new Int32Array(memoryRef.buffer);
				state.compiler.outputAddressLookup = data.payload.outputAddressLookup;
				state.compiler.isCompiling = false;
				const end = performance.now() - state.compiler.lastCompilationStart;
				state.compiler.compilationTime = end.toFixed(2);

				state.modules.forEach(module => {
					if (state.moduleTypes[module.type].transformer) {
						state.moduleTypes[module.type].transformer(
							module,
							state.compiler.memoryBuffer,
							state.compiler.outputAddressLookup
						);
					}
				});
				break;
		}
	}

	worker.addEventListener('message', onWorkerMessage);
	events.on('createConnection', recompile);
	events.on('deleteConnection', recompile);
	events.on('addModule', recompile);
	events.on('deleteModule', recompile);
	events.on('init', recompile);

	return () => {
		events.off('createConnection', recompile);
		events.off('deleteConnection', recompile);
		events.off('addModule', recompile);
		events.off('deleteModule', recompile);
		events.off('init', recompile);
	};
}
