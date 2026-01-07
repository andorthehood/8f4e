import { EventDispatcher } from '../types';

import type { State } from '../types';

export default function exportWasm(state: State, events: EventDispatcher): void {
	function onExportWasm() {
		if (!state.callbacks.exportBinaryFile) {
			console.warn('No exportProject callback provided');
			return;
		}

		const projectName = 'project';
		const fileName = `${projectName}.wasm`;

		state.callbacks.exportBinaryFile(fileName, 'application/wasm').catch(error => {
			console.error('Failed to export WebAssembly file:', error);
		});
	}

	events.on('exportWasm', onExportWasm);
}
