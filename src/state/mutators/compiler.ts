import * as moduleTypes from '../../modules';

export default function compiler(state, events) {
	const worker = new Worker(new URL('../../worker/index.ts', import.meta.url));
	// @ts-ignore shared: true
	const memoryRef = new WebAssembly.Memory({ initial: 1, maximum: 1, shared: true });

	const recompile = async () => {
		worker.postMessage({ memoryRef, modules: state.ui.modules, connections: state.ui.connections });
		state.ui.compiler.isCompiling = true;
		state.ui.compiler.lastCompilationStart = performance.now();
	};

	const onWorkerMessage = ({ data }) => {
		switch (data.type) {
			case 'midiMessage':
				events.dispatch('sendMidiMessage', data.payload);
				break;
			case 'compilationDone':
				state.ui.compiler.memoryBuffer = new Int32Array(memoryRef.buffer);
				state.ui.compiler.outputAddressLookup = data.payload.outputAddressLookup;
				state.ui.compiler.isCompiling = false;
				const end = performance.now() - state.ui.compiler.lastCompilationStart;
				state.ui.compiler.compilationTime = end.toFixed(2);

				state.ui.modules.forEach(module => {
					if (moduleTypes[module.type].transformer) {
						moduleTypes[module.type].transformer(
							module,
							state.ui.compiler.memoryBuffer,
							state.ui.compiler.outputAddressLookup
						);
					}
				});
				break;
		}
	};

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
