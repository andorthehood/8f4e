import { Engine } from 'glugglug';

import drawConnectors from './codeBlockDecorators/connectors';
import drawPlotters from './codeBlockDecorators/plotters';
import drawDebuggers from './codeBlockDecorators/debuggers';
import drawSwitches from './codeBlockDecorators/switches';
import drawButtons from './codeBlockDecorators/buttons';
import drawErrorMessages from './codeBlockDecorators/errorMessages';
import drawPianoKeyboards from './codeBlockDecorators/pianoKeyboards';
import drawArrow from './drawArrow';
import drawBlockHighlights from './codeBlockDecorators/blockHighlights';

import type { State } from '@8f4e/editor-state';
import type { MemoryViews } from '../../types';

export default function drawModules(engine: Engine, state: State, memoryViews: MemoryViews): void {
	if (!state.graphicHelper.spriteLookups) {
		return;
	}

	const { x, y } = state.graphicHelper.viewport;

	const offsetX = -x;
	const offsetY = -y;

	engine.startGroup(offsetX, offsetY);

	for (const codeBlock of state.graphicHelper.codeBlocks) {
		if (codeBlock.positionOffsetterXWordAddress) {
			codeBlock.offsetX = memoryViews.int32[codeBlock.positionOffsetterXWordAddress];
		}

		if (codeBlock.positionOffsetterYWordAddress) {
			codeBlock.offsetY = memoryViews.int32[codeBlock.positionOffsetterYWordAddress];
		}

		if (
			codeBlock.x + codeBlock.offsetX + offsetX > -1 * codeBlock.width &&
			codeBlock.y + codeBlock.offsetY + offsetY > -1 * codeBlock.height &&
			codeBlock.x + codeBlock.offsetX + offsetX < state.graphicHelper.viewport.width &&
			codeBlock.y + codeBlock.offsetY + offsetY < state.graphicHelper.viewport.height
		) {
			engine.startGroup(codeBlock.x + codeBlock.offsetX, codeBlock.y + codeBlock.offsetY);
			engine.cacheGroup(
				`codeBlock${codeBlock.creationIndex}${codeBlock.lastUpdated}`,
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

					drawBlockHighlights(engine, state, codeBlock);

					if (state.graphicHelper.selectedCodeBlock === codeBlock) {
						engine.drawSprite(
							0,
							codeBlock.cursor.y,
							'highlightedCodeLine',
							codeBlock.width,
							state.graphicHelper.viewport.hGrid
						);
					}

					if (state.graphicHelper.spriteLookups?.fontCode) {
						engine.setSpriteLookup(state.graphicHelper.spriteLookups.fontCode);
					}

					const corner = '+';

					engine.drawText(0, 0, corner);
					engine.drawText(codeBlock.width - state.graphicHelper.viewport.vGrid, 0, corner);
					engine.drawText(0, codeBlock.height - state.graphicHelper.viewport.hGrid, corner);
					engine.drawText(
						codeBlock.width - state.graphicHelper.viewport.vGrid,
						codeBlock.height - state.graphicHelper.viewport.hGrid,
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
									state.graphicHelper.viewport.vGrid * (j + 1),
									state.graphicHelper.viewport.hGrid * i,
									codeBlock.codeToRender[i][j]
								);
							}
						}
					}

					if (state.graphicHelper.selectedCodeBlock === codeBlock) {
						engine.drawText(codeBlock.cursor.x, codeBlock.cursor.y, '_');
					}

					drawPianoKeyboards(engine, state, codeBlock, memoryViews);
				},
				// Enable caching only when the block is NOT selected
				state.graphicHelper.selectedCodeBlock !== codeBlock
			);

			drawErrorMessages(engine, state, codeBlock);
			drawSwitches(engine, state, codeBlock, memoryViews);
			drawButtons(engine, state, codeBlock, memoryViews);
			drawConnectors(engine, state, codeBlock, memoryViews);
			drawPlotters(engine, state, codeBlock, memoryViews);
			drawDebuggers(engine, state, codeBlock, memoryViews);

			engine.endGroup();
		} else {
			// Module is off-screen, draw arrow indicators
			drawArrow(engine, codeBlock, state);
		}
	}

	engine.endGroup();
}
