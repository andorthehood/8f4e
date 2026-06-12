import type { CodeBlockGraphicData, EventDispatcher, State } from '@8f4e/editor-state-types';
import type { StateManager } from '@8f4e/state-manager';
import { saveSliderDefaultValuesToCode } from './saveDefaults';

export default function sliderDefaultSaver(store: StateManager<State>, events: EventDispatcher): () => void {
	const state = store.getState();

	const onSaveSliderValuesToCode = ({ codeBlock }: { codeBlock?: CodeBlockGraphicData } = {}) => {
		if (!state.featureFlags.editing) {
			return;
		}

		const targetCodeBlock = codeBlock ?? state.codeBlockRendering.selectedCodeBlock;
		if (!targetCodeBlock) {
			return;
		}

		const updatedCode = saveSliderDefaultValuesToCode(targetCodeBlock, state.callbacks?.getWordFromMemory);
		if (!updatedCode) {
			return;
		}

		targetCodeBlock.code = updatedCode;
		targetCodeBlock.lastUpdated = Date.now();
		state.codeBlockRendering.selectedCodeBlockForProgrammaticEdit = targetCodeBlock;
		store.set('codeBlockRendering.selectedCodeBlockForProgrammaticEdit', targetCodeBlock);
	};

	events.on('saveSliderValuesToCode', onSaveSliderValuesToCode);

	return () => {
		events.off('saveSliderValuesToCode', onSaveSliderValuesToCode);
	};
}
