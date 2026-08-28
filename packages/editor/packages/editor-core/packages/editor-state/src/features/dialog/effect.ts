import type { DialogContent, EventDispatcher, State } from '@8f4e/editor-state-types';
import type { StateManager } from '@8f4e/state-manager';
import roundToGrid from '~/features/viewport/roundToGrid';
import wrapText from '../code-blocks/utils/wrapText';

const DIALOG_MIN_WIDTH_GRID_CELLS = 64;
const DIALOG_MAX_WIDTH_GRID_CELLS = 96;
const DIALOG_VERTICAL_GRID_CELLS_WITHOUT_TEXT = 5;

type RemoveDialogEvent = string | { id: string };

export default function dialog(store: StateManager<State>, events: EventDispatcher): void {
	const state = store.getState();

	function syncVisibleDialog() {
		const visibleDialog = state.dialogStack[state.dialogStack.length - 1];

		if (!visibleDialog) {
			state.dialog.id = '';
			state.dialog.text = '';
			state.dialog.wrappedText = [''];
			state.dialog.title = '';
			state.dialog.buttons = [];
			state.dialog.width = 0;
			state.dialog.height = 0;
			state.dialog.x = 0;
			state.dialog.y = 0;
			return;
		}

		const dialogWidth = Math.min(
			Math.max(state.viewport.width * 0.5, DIALOG_MIN_WIDTH_GRID_CELLS * state.viewport.vGrid),
			DIALOG_MAX_WIDTH_GRID_CELLS * state.viewport.vGrid
		);
		const [roundedDialogWidth] = roundToGrid(dialogWidth, 0, state.viewport);
		const wrappedText = wrapText(visibleDialog.text, Math.floor(roundedDialogWidth / state.viewport.vGrid) - 2);
		const roundedDialogHeight = (wrappedText.length + DIALOG_VERTICAL_GRID_CELLS_WITHOUT_TEXT) * state.viewport.hGrid;

		state.dialog.id = visibleDialog.id;
		state.dialog.text = visibleDialog.text;
		state.dialog.title = visibleDialog.title;
		state.dialog.buttons = visibleDialog.buttons;
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

	function addDialog(dialogContent: DialogContent) {
		store.set('dialogStack', [...state.dialogStack.filter(dialog => dialog.id !== dialogContent.id), dialogContent]);
	}

	function removeDialog(event: RemoveDialogEvent) {
		const id = typeof event === 'string' ? event : event.id;
		store.set(
			'dialogStack',
			state.dialogStack.filter(dialog => dialog.id !== id)
		);
	}

	store.subscribe('dialogStack', syncVisibleDialog);
	events.on('resize', syncVisibleDialog);
	events.on('addDialog', addDialog);
	events.on('removeDialog', removeDialog);
	events.on('clearDialogs', () => store.set('dialogStack', []));

	syncVisibleDialog();
}
