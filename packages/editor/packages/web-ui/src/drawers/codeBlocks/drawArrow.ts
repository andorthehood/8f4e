import { Engine } from 'glugglug';
import { Icon } from '@8f4e/sprite-generator';

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
export function drawArrow(engine: Engine, codeBlock: CodeBlockGraphicData, state: State): void {
	const arrowPlacement = calculateArrowPlacement(codeBlock, state);

	if (state.graphicHelper.spriteLookups) {
		engine.setSpriteLookup(state.graphicHelper.spriteLookups.icons);
	}

	if (arrowPlacement.top) {
		engine.drawSprite(arrowPlacement.top.x, arrowPlacement.top.y, Icon.ARROW_TOP);
	}

	if (arrowPlacement.right) {
		engine.drawSprite(
			arrowPlacement.right.x - state.graphicHelper.viewport.vGrid,
			arrowPlacement.right.y,
			Icon.ARROW_RIGHT
		);
	}

	if (arrowPlacement.bottom) {
		engine.drawSprite(
			arrowPlacement.bottom.x,
			arrowPlacement.bottom.y - state.graphicHelper.viewport.hGrid,
			Icon.ARROW_BOTTOM
		);
	}

	if (arrowPlacement.left) {
		engine.drawSprite(arrowPlacement.left.x, arrowPlacement.left.y, Icon.ARROW_LEFT);
	}
}
