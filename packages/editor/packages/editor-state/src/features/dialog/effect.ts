import { StateManager } from '@8f4e/state-manager';

import wrapText from '../code-blocks/utils/wrapText';

import { EventDispatcher, State } from '~/types';
import roundToGrid from '~/features/viewport/roundToGrid';

export default function dialog(store: StateManager<State>, events: EventDispatcher): void {
	const state = store.getState();

	function resizeDialog() {
		const [roundedDialogWidth, roundedDialogHeight] = roundToGrid(
			state.viewport.width * 0.5,
			state.viewport.height * 0.5,
			state.viewport
		);

		state.dialog.width = roundedDialogWidth;
		state.dialog.height = roundedDialogHeight;

		const [roundedDialogX, roundedDialogY] = roundToGrid(
			(state.viewport.width - state.dialog.width) / 2,
			(state.viewport.height - state.dialog.height) / 2,
			state.viewport
		);

		state.dialog.x = roundedDialogX;
		state.dialog.y = roundedDialogY;

		state.dialog.wrappedText = wrapText(state.dialog.text, Math.floor(state.dialog.width / state.viewport.vGrid) - 2);
	}

	store.subscribe('dialog', resizeDialog);
	events.on('resize', resizeDialog);
}
