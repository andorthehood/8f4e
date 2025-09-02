import { EventDispatcher } from '../../events';
import type { State } from '../types';
import { encodeUint8ArrayToBase64 } from '../helpers/base64Encoder';

export default function save(state: State, events: EventDispatcher): void {
	function onSave() {
		if (!state.options.exportFile) {
			console.warn('No exportFile callback provided');
			return;
		}

		const filename = `${state.project.title || 'project'}.json`;
		const json = JSON.stringify(state.project, null, 2);

		state.options.exportFile(json, filename, 'application/json').catch(error => {
			console.error('Failed to save project to file:', error);
		});
	}

	function onSaveRuntimeReady() {
		if (!state.options.exportFile) {
			console.warn('No exportFile callback provided');
			return;
		}

		// Check if compiled WASM code is available
		if (!state.compiler.codeBuffer || state.compiler.codeBuffer.length === 0) {
			console.warn('No compiled WebAssembly code available. Please compile your project first.');
			return;
		}

		// Create a copy of the project with compiled WASM included
		const runtimeProject = {
			...state.project,
			// Convert WASM bytecode to base64 string using chunked encoding to avoid stack overflow
			compiledWasm: encodeUint8ArrayToBase64(state.compiler.codeBuffer),
		};

		const filename = `${state.project.title || 'project'}-runtime-ready.json`;
		const json = JSON.stringify(runtimeProject, null, 2);

		state.options.exportFile(json, filename, 'application/json').catch(error => {
			console.error('Failed to save runtime-ready project to file:', error);
		});
	}

	events.on('save', onSave);
	events.on('saveRuntimeReady', onSaveRuntimeReady);
}
