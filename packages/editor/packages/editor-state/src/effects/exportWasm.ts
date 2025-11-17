import { EventDispatcher } from '../types';

import type { State } from '../types';

export default function exportWasm(state: State, events: EventDispatcher): void {
	function onExportWasm() {
		if (!state.callbacks.exportBinaryFile) {
			console.warn('No exportProject callback provided');
			return;
		}

		// Check if compiled WASM code is available
		if (!state.compiler.codeBuffer || state.compiler.codeBuffer.length === 0) {
			console.warn('No compiled WebAssembly code available. Please compile your project first.');
			return;
		}

		// Generate fileName based on project title
		const projectName = state.projectInfo.title || 'project';
		const fileName = `${projectName}.wasm`;

		// Export the compiled WASM bytecode
		state.callbacks.exportBinaryFile(state.compiler.codeBuffer, fileName, 'application/wasm').catch(error => {
			console.error('Failed to export WebAssembly file:', error);
		});
	}

	events.on('exportWasm', onExportWasm);
}
