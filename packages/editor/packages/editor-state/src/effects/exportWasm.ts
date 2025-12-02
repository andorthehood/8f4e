import { EventDispatcher } from '../types';

import type { State } from '../types';

export default function exportWasm(state: State, events: EventDispatcher): void {
	function onExportWasm() {
		if (!state.callbacks.exportBinaryFile) {
			console.warn('No exportProject callback provided');
			return;
		}

		if (!state.compiler.codeBuffer || state.compiler.codeBuffer.length === 0) {
			console.warn('No compiled WebAssembly code available. Please compile your project first.');
			return;
		}

		const projectName = state.projectInfo.title || 'project';
		const fileName = `${projectName}.wasm`;

		state.callbacks.exportBinaryFile(state.compiler.codeBuffer, fileName, 'application/wasm').catch(error => {
			console.error('Failed to export WebAssembly file:', error);
		});
	}

	events.on('exportWasm', onExportWasm);
}
