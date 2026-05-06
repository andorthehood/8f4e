import { StateManager } from '@8f4e/state-manager';

import wrapText from '../code-blocks/utils/wrapText';

import type { EventDispatcher, State } from '@8f4e/editor-state-types';

import roundToGrid from '~/features/viewport/roundToGrid';

const DIALOG_MIN_WIDTH_GRID_CELLS = 64;
const DIALOG_MAX_WIDTH_GRID_CELLS = 96;
const DIALOG_VERTICAL_GRID_CELLS_WITHOUT_TEXT = 5;

export default function dialog(store: StateManager<State>, events: EventDispatcher): void {
	const state = store.getState();

	function resizeDialog() {
		const dialogWidth = Math.min(
			Math.max(state.viewport.width * 0.5, DIALOG_MIN_WIDTH_GRID_CELLS * state.viewport.vGrid),
			DIALOG_MAX_WIDTH_GRID_CELLS * state.viewport.vGrid
		);
		const [roundedDialogWidth] = roundToGrid(dialogWidth, 0, state.viewport);
		const wrappedText = wrapText(state.dialog.text, Math.floor(roundedDialogWidth / state.viewport.vGrid) - 2);
		const roundedDialogHeight = (wrappedText.length + DIALOG_VERTICAL_GRID_CELLS_WITHOUT_TEXT) * state.viewport.hGrid;

		state.dialog.width = roundedDialogWidth;
		state.dialog.height = roundedDialogHeight;

		const [roundedDialogX, roundedDialogY] = roundToGrid(
			(state.viewport.width - state.dialog.width) / 2,
			(state.viewport.height - state.dialog.height) / 2,
			state.viewport
		);

		state.dialog.x = roundedDialogX;
		state.dialog.y = roundedDialogY;

		state.dialog.wrappedText = wrappedText;
	}

	store.subscribe('dialog', resizeDialog);
	events.on('resize', resizeDialog);
}
