import { State } from '../types';

export function compilationDone(state: State, data, memoryRef: WebAssembly.Memory): void {
	state.compiler.memoryBuffer = new Int32Array(memoryRef.buffer);
	state.compiler.memoryRef = memoryRef;
	state.compiler.memoryAddressLookup = data.payload.memoryAddressLookup;
	state.compiler.isCompiling = false;
	state.compiler.compilationTime = (performance.now() - state.compiler.lastCompilationStart).toFixed(2);
	state.compiler.compiledModules = data.payload.compiledModules;
}

export function recompile(state: State): void {
	state.compiler.isCompiling = true;
	state.compiler.lastCompilationStart = performance.now();
}
