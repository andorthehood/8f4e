import { HGRID, VGRID } from '../../view/drawers/consts';
import { State } from '../types';

export function compilationDone(state: State, data, memoryRef: WebAssembly.Memory): void {
	state.compiler.memoryBuffer = new Int32Array(memoryRef.buffer);
	state.compiler.memoryAddressLookup = data.payload.memoryAddressLookup;
	state.compiler.isCompiling = false;
	state.compiler.compilationTime = (performance.now() - state.compiler.lastCompilationStart).toFixed(2);
	state.compiler.compiledModules = data.payload.compiledModules;

	// TODO: refactor this
	// initialize graphic helper
	state.modules.forEach(module => {
		state.graphicHelper.set(module.id, {
			width: 30 * VGRID,
			height: module.code.length * HGRID,
			inputs: new Map(),
			outputs: new Map(),
		});

		for (let i = 0; i < state.compiler.compiledModules.get(module.id).outputs.length; i++) {
			const output = state.compiler.compiledModules.get(module.id).outputs[i];

			state.graphicHelper.get(module.id).outputs.set(output.id, {
				width: VGRID * 2,
				height: HGRID,
				x: VGRID * 3 + VGRID * module.code[output.lineNumber - 1].length,
				y: HGRID * (output.lineNumber - 1),
				id: output.id,
			});
		}

		for (let i = 0; i < state.compiler.compiledModules.get(module.id).inputs.length; i++) {
			const input = state.compiler.compiledModules.get(module.id).inputs[i];

			state.graphicHelper.get(module.id).inputs.set(input.id, {
				width: VGRID * 2,
				height: HGRID,
				x: 0,
				y: HGRID * (input.lineNumber - 1),
				id: input.id,
			});
		}
	});
}

export function recompile(state: State): void {
	state.compiler.isCompiling = true;
	state.compiler.lastCompilationStart = performance.now();
}
