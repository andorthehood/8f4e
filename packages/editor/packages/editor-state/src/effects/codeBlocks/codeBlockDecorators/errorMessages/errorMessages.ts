import { StateManager } from '@8f4e/state-manager';

import wrapText from '../../../../pureHelpers/wrapText';
import gapCalculator from '../../../../pureHelpers/codeEditing/gapCalculator';
import { State } from '../../../../types';

export default function errorMessages(store: StateManager<State>) {
	const state = store.getState();

	function updateErrorMessages() {
		const codeErrors = [...state.codeErrors.compilationErrors, ...state.codeErrors.configErrors];
		state.graphicHelper.codeBlocks.forEach(codeBlock => {
			codeBlock.extras.errorMessages = [];
			codeErrors.forEach(codeError => {
				if (codeBlock.creationIndex === codeError.codeBlockId || codeBlock.id === codeError.codeBlockId) {
					const message = wrapText(codeError.message, codeBlock.width / state.graphicHelper.viewport.vGrid - 1);

					codeBlock.extras.errorMessages.push({
						x: 0,
						y: (gapCalculator(codeError.lineNumber, codeBlock.gaps) + 1) * state.graphicHelper.viewport.hGrid,
						message: ['Error:', ...message],
						lineNumber: codeError.lineNumber,
					});
				}
			});
		});

		// To trigger rerender TODO: refactor this
		store.set('graphicHelper.codeBlocks', state.graphicHelper.codeBlocks);
	}

	updateErrorMessages();

	store.subscribe('codeErrors', updateErrorMessages);
}
