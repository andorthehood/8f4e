import { Engine } from 'glugglug';

import { calculateArrowPlacement } from './arrowPlacement';

import type { State } from '@8f4e/editor-state';
import type { CodeBlockGraphicData } from '@8f4e/editor-state';

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

	if (state.graphicHelper.spriteLookups) {
		engine.setSpriteLookup(state.graphicHelper.spriteLookups.fontCodeComment);
	}

	if (arrowPlacement.top) {
		engine.drawSprite(arrowPlacement.top.x, arrowPlacement.top.y, '^');
	}

	if (arrowPlacement.right) {
		engine.drawSprite(arrowPlacement.right.x - state.viewport.vGrid, arrowPlacement.right.y, '>');
	}

	if (arrowPlacement.bottom) {
		engine.drawSprite(arrowPlacement.bottom.x, arrowPlacement.bottom.y - state.viewport.hGrid, 'v');
	}

	if (arrowPlacement.left) {
		engine.drawSprite(arrowPlacement.left.x, arrowPlacement.left.y, '<');
	}
}
