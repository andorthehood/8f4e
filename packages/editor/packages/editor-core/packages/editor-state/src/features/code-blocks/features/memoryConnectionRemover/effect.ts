import type { CodeBlockGraphicData, EventDispatcher, State } from '@8f4e/editor-state-types';
import type { StateManager } from '@8f4e/state-manager';
import { removeIntermodularMemoryConnectionsFromCode } from './removeConnections';

export default function memoryConnectionRemover(store: StateManager<State>, events: EventDispatcher): () => void {
	const state = store.getState();

	const onRemoveConnections = ({ codeBlock }: { codeBlock?: CodeBlockGraphicData } = {}) => {
		if (!state.featureFlags.editing) {
			return;
		}

		const targetCodeBlock = codeBlock ?? state.codeBlockRendering.selectedCodeBlock;
		if (!targetCodeBlock) {
			return;
		}

		const updatedCode = removeIntermodularMemoryConnectionsFromCode(targetCodeBlock.code);
		if (!updatedCode) {
			return;
		}

		targetCodeBlock.code = updatedCode;
		targetCodeBlock.lastUpdated = Date.now();
		state.codeBlockRendering.selectedCodeBlockForProgrammaticEdit = targetCodeBlock;
		store.set('codeBlockRendering.selectedCodeBlockForProgrammaticEdit', targetCodeBlock);
	};

	events.on('removeConnections', onRemoveConnections);

	return () => {
		events.off('removeConnections', onRemoveConnections);
	};
}
