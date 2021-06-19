import { State } from '../types';

export function compilationDone(state: State, data, memoryRef): void {
	state.compiler.memoryBuffer = new Int32Array(memoryRef.buffer);
	state.compiler.outputAddressLookup = data.payload.outputAddressLookup;
	state.compiler.isCompiling = false;
	state.compiler.compilationTime = (performance.now() - state.compiler.lastCompilationStart).toFixed(2);

	state.modules.forEach(module => {
		if (state.moduleTypes[module.type].transformer) {
			state.moduleTypes[module.type].transformer(
				module,
				state.compiler.memoryBuffer,
				state.compiler.outputAddressLookup
			);
		}
	});
}

export function recompile(state: State): void {
	state.compiler.isCompiling = true;
	state.compiler.lastCompilationStart = performance.now();
}
