import type { State } from '@8f4e/editor-state-types';
import type { DrawContext } from '../drawContext';

const DIALOG_CORNER = '+';

export default function drawDialog(engine: DrawContext, state: State): void {
	if (state.dialogStack.length === 0 || !state.spriteLookups) {
		return;
	}

	engine.startGroup(0, 0);
	engine.drawSprite(0, 0, state.spriteLookups.fillColors.dialogDimmer, state.viewport.width, state.viewport.height);
	engine.endGroup();

	engine.startGroup(state.dialog.x, state.dialog.y);

	engine.drawSprite(0, 0, state.spriteLookups.fillColors.dialogBackground, state.dialog.width, state.dialog.height);

	engine.drawText(0, 0, DIALOG_CORNER, state.spriteLookups.fontCode);
	engine.drawText(state.dialog.width - state.viewport.vGrid, 0, DIALOG_CORNER, state.spriteLookups.fontCode);
	engine.drawText(0, state.dialog.height - state.viewport.hGrid, DIALOG_CORNER, state.spriteLookups.fontCode);
	engine.drawText(
		state.dialog.width - state.viewport.vGrid,
		state.dialog.height - state.viewport.hGrid,
		DIALOG_CORNER,
		state.spriteLookups.fontCode
	);

	engine.drawText(state.viewport.vGrid, state.viewport.hGrid, state.dialog.title, state.spriteLookups.fontDialogTitle);

	for (let i = 0; i < state.dialog.wrappedText.length; i++) {
		const textY = state.viewport.hGrid * (3 + i);
		engine.drawText(state.viewport.vGrid, textY, state.dialog.wrappedText[i], state.spriteLookups.fontDialogText);
	}

	for (let i = 0; i < state.dialog.buttons.length; i++) {
		const button = state.dialog.buttons[i];
		const isHighlighted = i === state.dialog.highlightedButton;
		engine.drawSprite(
			button.x,
			button.y,
			isHighlighted
				? state.spriteLookups.fillColors.menuItemBackgroundHighlighted
				: state.spriteLookups.fillColors.menuItemBackground,
			button.width,
			button.height
		);
		engine.drawText(
			button.x,
			button.y,
			`[${button.title}]`,
			isHighlighted ? state.spriteLookups.fontMenuItemTextHighlighted : state.spriteLookups.fontMenuItemText
		);
	}

	engine.endGroup();
}
