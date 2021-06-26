import { State } from '../types';

export function compilationDone(state: State, data, memoryRef): void {
	state.compiler.memoryBuffer = new Int32Array(memoryRef.buffer);
	state.compiler.memoryAddressLookup = data.payload.memoryAddressLookup;
	state.compiler.isCompiling = false;
	state.compiler.compilationTime = (performance.now() - state.compiler.lastCompilationStart).toFixed(2);
}

export function recompile(state: State): void {
	state.compiler.isCompiling = true;
	state.compiler.lastCompilationStart = performance.now();
}
