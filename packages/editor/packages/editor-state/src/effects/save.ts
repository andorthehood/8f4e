import { EventDispatcher } from '../types';
import { encodeUint8ArrayToBase64 } from '../helpers/base64Encoder';

import type { State } from '../types';

export default function save(state: State, events: EventDispatcher): void {
	function onSave() {
		if (!state.callbacks.exportFile) {
			console.warn('No exportFile callback provided');
			return;
		}

		const filename = `${state.project.title || 'project'}.json`;
		// Include memory configuration in saved project
		const projectToSave = {
			...state.project,
			memory: {
				memorySize: state.compiler.compilerOptions.memorySize,
			},
		};
		const json = JSON.stringify(projectToSave, null, 2);

		state.callbacks.exportFile(json, filename, 'application/json').catch(error => {
			console.error('Failed to save project to file:', error);
		});
	}

	function onSaveRuntimeReady() {
		if (!state.callbacks.exportFile) {
			console.warn('No exportFile callback provided');
			return;
		}

		// Check if compiled WASM code is available
		if (!state.compiler.codeBuffer || state.compiler.codeBuffer.length === 0) {
			console.warn('No compiled WebAssembly code available. Please compile your project first.');
			return;
		}

		const memorySnapshotBytes =
			state.compiler.memoryBuffer && state.compiler.allocatedMemorySize > 0
				? new Uint8Array(
						state.compiler.memoryBuffer.buffer,
						state.compiler.memoryBuffer.byteOffset,
						Math.min(state.compiler.allocatedMemorySize, state.compiler.memoryBuffer.byteLength)
					)
				: undefined;

		// Create a copy of the project with compiled WASM included
		const runtimeProject = {
			...state.project,
			// Convert WASM bytecode to base64 string using chunked encoding to avoid stack overflow
			compiledWasm: encodeUint8ArrayToBase64(state.compiler.codeBuffer),
			memorySnapshot: memorySnapshotBytes ? encodeUint8ArrayToBase64(memorySnapshotBytes) : undefined,
			compiledModules: state.compiler.compiledModules,
			// Include memory configuration in runtime-ready exports
			memory: {
				memorySize: state.compiler.compilerOptions.memorySize,
			},
		};

		const filename = `${state.project.title || 'project'}-runtime-ready.json`;
		const json = JSON.stringify(runtimeProject, null, 2);

		state.callbacks.exportFile(json, filename, 'application/json').catch(error => {
			console.error('Failed to save runtime-ready project to file:', error);
		});
	}

	events.on('save', onSave);
	events.on('saveRuntimeReady', onSaveRuntimeReady);
}
