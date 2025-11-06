import { EventDispatcher } from '../types';
import { encodeUint8ArrayToBase64 } from '../helpers/base64Encoder';
import { serializeToProject } from '../helpers/projectSerializer';

import type { State } from '../types';

export default function save(state: State, events: EventDispatcher): void {
	function onSave() {
		if (!state.callbacks.exportFile) {
			console.warn('No exportFile callback provided');
			return;
		}

		const projectToSave = serializeToProject(state);
		const filename = `${projectToSave.title || 'project'}.json`;
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

		// Serialize to project format, then add compiled fields
		const runtimeProject = {
			...serializeToProject(state),
			// Convert WASM bytecode to base64 string using chunked encoding to avoid stack overflow
			compiledWasm: encodeUint8ArrayToBase64(state.compiler.codeBuffer),
			memorySnapshot: memorySnapshotBytes ? encodeUint8ArrayToBase64(memorySnapshotBytes) : undefined,
		};

		const filename = `${runtimeProject.title || 'project'}-runtime-ready.json`;
		const json = JSON.stringify(runtimeProject, null, 2);

		state.callbacks.exportFile(json, filename, 'application/json').catch(error => {
			console.error('Failed to save runtime-ready project to file:', error);
		});
	}

	events.on('save', onSave);
	events.on('saveRuntimeReady', onSaveRuntimeReady);
}
