import { EventDispatcher } from '../types';

import type { State } from '../types';

export default function exportWasm(state: State, events: EventDispatcher): void {
	function onExportWasm() {
		if (!state.callbacks.exportFile) {
			console.warn('No exportFile callback provided');
			return;
		}

		// Check if compiled WASM code is available
		if (!state.compiler.codeBuffer || state.compiler.codeBuffer.length === 0) {
			console.warn('No compiled WebAssembly code available. Please compile your project first.');
			return;
		}

		// Generate filename based on project title
		const projectName = state.projectInfo.title || 'project';
		const filename = `${projectName}.wasm`;

		// Export the compiled WASM bytecode
		state.callbacks.exportFile(state.compiler.codeBuffer, filename, 'application/wasm').catch(error => {
			console.error('Failed to export WebAssembly file:', error);
		});
	}

	events.on('exportWasm', onExportWasm);
}
