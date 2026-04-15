import { Engine } from 'glugglug';

import { calculateArrowPlacement } from './arrowPlacement';

import type { State } from '@8f4e/editor-state';
import type { CodeBlockGraphicData } from '@8f4e/editor-state';

const ARROW_CHARACTERS = {
	top: '^',
	right: '>',
	bottom: 'v',
	left: '<',
} as const;

/**
 * Draws directional arrow indicators for an off-screen code block.
 * Arrows are positioned at viewport edges to indicate the direction of off-screen modules.
 *
 * @param engine - The rendering engine
 * @param codeBlock - The off-screen code block to draw arrows for
 * @param state - The editor state containing viewport and sprite lookup information
 */
export default function drawArrow(engine: Engine, codeBlock: CodeBlockGraphicData, state: State): void {
	const arrowPlacement = calculateArrowPlacement(codeBlock, state);

	if (state.graphicHelper.spriteLookups?.fontArrow) {
		engine.setSpriteLookup(state.graphicHelper.spriteLookups.fontArrow);
	}

	if (arrowPlacement.top) {
		engine.drawText(arrowPlacement.top.x, arrowPlacement.top.y, ARROW_CHARACTERS.top);
	}

	if (arrowPlacement.right) {
		engine.drawText(arrowPlacement.right.x - state.viewport.vGrid, arrowPlacement.right.y, ARROW_CHARACTERS.right);
	}

	if (arrowPlacement.bottom) {
		engine.drawText(arrowPlacement.bottom.x, arrowPlacement.bottom.y - state.viewport.hGrid, ARROW_CHARACTERS.bottom);
	}

	if (arrowPlacement.left) {
		engine.drawText(arrowPlacement.left.x, arrowPlacement.left.y, ARROW_CHARACTERS.left);
	}
}
