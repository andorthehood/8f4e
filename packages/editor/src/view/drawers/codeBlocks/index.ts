import { Engine } from '@8f4e/2d-engine';

import drawConnectors from './extras/connectors';
import drawPlotters from './extras/plotters';
import drawDebuggers from './extras/debuggers';
import drawSwitches from './extras/switches';
import drawButtons from './extras/buttons';
import drawErrorMessages from './extras/errorMessages';
import drawPianoKeyboards from './extras/pianoKeyboards';

import type { State } from '../../../state/types';

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
					engine.setSpriteLookup(state.graphicHelper.spriteLookups.fillColors);

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

					engine.setSpriteLookup(state.graphicHelper.spriteLookups.fontCode);

					const corner = codeBlock.isOpen ? '+' : '+';

					engine.drawText(0, 0, corner);
					engine.drawText(codeBlock.width - state.graphicHelper.globalViewport.vGrid, 0, corner);
					engine.drawText(0, codeBlock.height - state.graphicHelper.globalViewport.hGrid, corner);
					engine.drawText(
						codeBlock.width - state.graphicHelper.globalViewport.vGrid,
						codeBlock.height - state.graphicHelper.globalViewport.hGrid,
						corner
					);

					engine.setSpriteLookup(state.graphicHelper.spriteLookups.fontCode);

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

					drawSwitches(engine, state, codeBlock);
					drawButtons(engine, state, codeBlock);
					drawErrorMessages(engine, state, codeBlock);
					drawPianoKeyboards(engine, state, codeBlock);
				},
				// Enable caching only when the block is NOT selected
				state.graphicHelper.selectedCodeBlock !== codeBlock
			);

			drawConnectors(engine, state, codeBlock);
			drawPlotters(engine, state, codeBlock);
			drawDebuggers(engine, state, codeBlock);

			engine.endGroup();
		}
	}

	engine.endGroup();
}
