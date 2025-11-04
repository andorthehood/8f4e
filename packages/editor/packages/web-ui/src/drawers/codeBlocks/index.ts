import { Engine } from 'glugglug';
import { Icon } from '@8f4e/sprite-generator';

import drawConnectors from './extras/connectors';
import drawPlotters from './extras/plotters';
import drawDebuggers from './extras/debuggers';
import drawSwitches from './extras/switches';
import drawButtons from './extras/buttons';
import drawErrorMessages from './extras/errorMessages';
import drawPianoKeyboards from './extras/pianoKeyboards';
import { calculateArrowPlacement } from './arrowPlacement';

import type { State } from '@8f4e/editor-state';
import type { CodeBlockGraphicData } from '@8f4e/editor-state';

function drawArrow(engine: Engine, codeBlock: CodeBlockGraphicData, state: State): void {
	const arrowPlacement = calculateArrowPlacement(codeBlock, state);

	if (state.graphicHelper.spriteLookups) {
		engine.setSpriteLookup(state.graphicHelper.spriteLookups.icons);
	}

	if (arrowPlacement.top) {
		engine.drawSprite(arrowPlacement.top.x, arrowPlacement.top.y, Icon.ARROW_TOP);
	}

	if (arrowPlacement.right) {
		engine.drawSprite(
			arrowPlacement.right.x - state.graphicHelper.globalViewport.vGrid,
			arrowPlacement.right.y,
			Icon.ARROW_RIGHT
		);
	}

	if (arrowPlacement.bottom) {
		engine.drawSprite(
			arrowPlacement.bottom.x,
			arrowPlacement.bottom.y - state.graphicHelper.globalViewport.hGrid,
			Icon.ARROW_BOTTOM
		);
	}

	if (arrowPlacement.left) {
		engine.drawSprite(arrowPlacement.left.x, arrowPlacement.left.y, Icon.ARROW_LEFT);
	}
}

export default function drawModules(engine: Engine, state: State): void {
	if (!state.graphicHelper.spriteLookups) {
		return;
	}

	const { x, y } = state.graphicHelper.activeViewport.viewport;

	const offsetX = -x;
	const offsetY = -y;

	engine.startGroup(offsetX, offsetY);

	for (const codeBlock of state.graphicHelper.activeViewport.codeBlocks) {
		if (codeBlock.positionOffsetterXWordAddress) {
			codeBlock.offsetX = state.compiler.memoryBuffer[codeBlock.positionOffsetterXWordAddress];
		}

		if (codeBlock.positionOffsetterYWordAddress) {
			codeBlock.offsetY = state.compiler.memoryBuffer[codeBlock.positionOffsetterYWordAddress];
		}

		if (
			codeBlock.x + codeBlock.offsetX + offsetX > -1 * codeBlock.width &&
			codeBlock.y + codeBlock.offsetY + offsetY > -1 * codeBlock.height &&
			codeBlock.x + codeBlock.offsetX + offsetX < state.graphicHelper.globalViewport.width &&
			codeBlock.y + codeBlock.offsetY + offsetY < state.graphicHelper.globalViewport.height
		) {
			engine.startGroup(codeBlock.x + codeBlock.offsetX, codeBlock.y + codeBlock.offsetY);
			engine.cacheGroup(
				`codeBlock${codeBlock.id}${codeBlock.lastUpdated}`,
				codeBlock.width,
				codeBlock.height,
				() => {
					if (state.graphicHelper.spriteLookups?.fillColors) {
						engine.setSpriteLookup(state.graphicHelper.spriteLookups.fillColors);
					}

					if (codeBlock === state.graphicHelper.draggedCodeBlock) {
						engine.drawSprite(0, 0, 'moduleBackgroundDragged', codeBlock.width, codeBlock.height);
					} else {
						engine.drawSprite(0, 0, 'moduleBackground', codeBlock.width, codeBlock.height);
					}

					if (state.graphicHelper.selectedCodeBlock === codeBlock) {
						engine.drawSprite(
							0,
							codeBlock.cursor.y,
							'highlightedCodeLine',
							codeBlock.width,
							state.graphicHelper.globalViewport.hGrid
						);
					}

					if (state.graphicHelper.spriteLookups?.fontCode) {
						engine.setSpriteLookup(state.graphicHelper.spriteLookups.fontCode);
					}

					const corner = codeBlock.isOpen ? '+' : '+';

					engine.drawText(0, 0, corner);
					engine.drawText(codeBlock.width - state.graphicHelper.globalViewport.vGrid, 0, corner);
					engine.drawText(0, codeBlock.height - state.graphicHelper.globalViewport.hGrid, corner);
					engine.drawText(
						codeBlock.width - state.graphicHelper.globalViewport.vGrid,
						codeBlock.height - state.graphicHelper.globalViewport.hGrid,
						corner
					);

					if (state.graphicHelper.spriteLookups?.fontCode) {
						engine.setSpriteLookup(state.graphicHelper.spriteLookups.fontCode);
					}

					for (let i = 0; i < codeBlock.codeToRender.length; i++) {
						for (let j = 0; j < codeBlock.codeToRender[i].length; j++) {
							const lookup = codeBlock.codeColors[i][j];
							if (lookup) {
								engine.setSpriteLookup(lookup);
							}
							if (codeBlock.codeToRender[i][j] !== 32) {
								engine.drawSprite(
									state.graphicHelper.globalViewport.vGrid * (j + 1),
									state.graphicHelper.globalViewport.hGrid * i,
									codeBlock.codeToRender[i][j]
								);
							}
						}
					}

					if (state.graphicHelper.selectedCodeBlock === codeBlock) {
						engine.drawText(codeBlock.cursor.x, codeBlock.cursor.y, '_');
					}

					drawPianoKeyboards(engine, state, codeBlock);
				},
				// Enable caching only when the block is NOT selected
				state.graphicHelper.selectedCodeBlock !== codeBlock
			);

			drawErrorMessages(engine, state, codeBlock);
			drawSwitches(engine, state, codeBlock);
			drawButtons(engine, state, codeBlock);
			drawConnectors(engine, state, codeBlock);
			drawPlotters(engine, state, codeBlock);
			drawDebuggers(engine, state, codeBlock);

			engine.endGroup();
		} else {
			// Module is off-screen, draw arrow indicators
			drawArrow(engine, codeBlock, state);
		}
	}

	engine.endGroup();
}
