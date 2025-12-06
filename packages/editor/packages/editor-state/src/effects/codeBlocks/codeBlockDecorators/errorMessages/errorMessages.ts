import { StateManager } from '@8f4e/state-manager';

import wrapText from '../../../../pureHelpers/wrapText';
import { gapCalculator } from '../../../../pureHelpers/codeEditing/gapCalculator';
import { State } from '../../../../types';

export default function errorMessages(store: StateManager<State>) {
	const state = store.getState();

	function updateCompilationErrors() {
		state.graphicHelper.codeBlocks.forEach(codeBlock => {
			if (codeBlock.blockType !== 'module') {
				return;
			}

			codeBlock.extras.errorMessages = [];
			state.compiler.compilationErrors.forEach(compilationError => {
				if (codeBlock.id === compilationError.moduleId) {
					const message = wrapText(compilationError.message, codeBlock.width / state.graphicHelper.viewport.vGrid - 1);

					codeBlock.extras.errorMessages.push({
						x: 0,
						y: (gapCalculator(compilationError.lineNumber, codeBlock.gaps) + 1) * state.graphicHelper.viewport.hGrid,
						message: ['Error:', ...message],
						lineNumber: compilationError.lineNumber,
					});

					// To trigger rerender TODO: refactor this
					store.set('graphicHelper.codeBlocks', state.graphicHelper.codeBlocks);
				}
			});
		});
	}

	function updateConfigErrors() {
		state.graphicHelper.codeBlocks.forEach(codeBlock => {
			if (codeBlock.blockType !== 'config') {
				return;
			}

			codeBlock.extras.errorMessages = [];

			// If the error got fixed, we need to trigger rerender to make the gap disappear. TODO: refactor this.
			if (state.configErrors.length === 0) {
				store.set('graphicHelper.codeBlocks', state.graphicHelper.codeBlocks);
			}

			state.configErrors.forEach(configError => {
				if (codeBlock.creationIndex === configError.creationIndex) {
					const message = wrapText(configError.message, codeBlock.width / state.graphicHelper.viewport.vGrid - 1);

					codeBlock.extras.errorMessages.push({
						x: 0,
						y: (gapCalculator(configError.line, codeBlock.gaps) + 1) * state.graphicHelper.viewport.hGrid,
						message: ['Error:', ...message],
						lineNumber: configError.line,
					});

					// To trigger rerender TODO: refactor this
					store.set('graphicHelper.codeBlocks', state.graphicHelper.codeBlocks);
				}
			});
		});
	}

	updateConfigErrors();
	updateCompilationErrors();

	store.subscribe('configErrors', updateConfigErrors);
	store.subscribe('compiler.compilationErrors', updateCompilationErrors);
}
