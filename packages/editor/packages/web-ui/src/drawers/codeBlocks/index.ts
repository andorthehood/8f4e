import { Engine } from 'glugglug';

import drawConnectors from './widgets/connectors';
import drawPlotters from './widgets/plotters';
import drawScanners from './widgets/scanners';
import drawDebuggers from './widgets/debuggers';
import drawSwitches from './widgets/switches';
import drawButtons from './widgets/buttons';
import drawSliders from './widgets/sliders';
import drawErrorMessages from './widgets/errorMessages';
import drawPianoKeyboards from './widgets/pianoKeyboards';
import drawArrow from './drawArrow';
import drawBlockHighlights from './widgets/blockHighlights';

import type { State } from '@8f4e/editor-state';
import type { MemoryViews } from '../../types';

const corner = '+';

function drawSelectedOutline(engine: Engine, state: State, codeBlockWidth: number, codeBlockHeight: number): void {
	const { vGrid, hGrid } = state.viewport;

	engine.setSpriteLookup(state.graphicHelper.spriteLookups!.fontNumbers);

	engine.drawText(-vGrid * 2, -hGrid, '.');
	engine.drawText(-vGrid, -hGrid, '-');
	engine.drawText(codeBlockWidth, -hGrid, '-');
	engine.drawText(codeBlockWidth + vGrid, -hGrid, '.');

	engine.drawText(-vGrid * 2, 0, '|');
	engine.drawText(codeBlockWidth + vGrid, 0, '|');
	engine.drawText(-vGrid * 2, codeBlockHeight - hGrid, '|');
	engine.drawText(codeBlockWidth + vGrid, codeBlockHeight - hGrid, '|');

	engine.drawText(-vGrid * 2, codeBlockHeight, '`');
	engine.drawText(-vGrid, codeBlockHeight, '-');
	engine.drawText(codeBlockWidth, codeBlockHeight, '-');
	engine.drawText(codeBlockWidth + vGrid, codeBlockHeight, "'");
}

export default function drawModules(engine: Engine, state: State, memoryViews: MemoryViews): void {
	const spriteLookups = state.graphicHelper.spriteLookups;

	if (!spriteLookups) {
		return;
	}

	const { x, y } = state.viewport;

	const offsetX = -x;
	const offsetY = -y;

	engine.startGroup(offsetX, offsetY);

	for (const codeBlock of state.graphicHelper.codeBlocks) {
		// Read position offsets from memory only if the feature is enabled
		if (state.featureFlags.positionOffsetters) {
			if (codeBlock.positionOffsetterXWordAddress) {
				codeBlock.offsetX = memoryViews.int32[codeBlock.positionOffsetterXWordAddress];
			}

			if (codeBlock.positionOffsetterYWordAddress) {
				codeBlock.offsetY = memoryViews.int32[codeBlock.positionOffsetterYWordAddress];
			}
		} else {
			// When disabled, force offsets to 0
			codeBlock.offsetX = 0;
			codeBlock.offsetY = 0;
		}

		if (
			codeBlock.x + codeBlock.offsetX + offsetX > -1 * codeBlock.width &&
			codeBlock.y + codeBlock.offsetY + offsetY > -1 * codeBlock.height &&
			codeBlock.x + codeBlock.offsetX + offsetX < state.viewport.width &&
			codeBlock.y + codeBlock.offsetY + offsetY < state.viewport.height
		) {
			engine.startGroup(codeBlock.x + codeBlock.offsetX, codeBlock.y + codeBlock.offsetY);
			engine.cacheGroup(
				codeBlock.textureCacheKey,
				codeBlock.width,
				codeBlock.height,
				() => {
					engine.setSpriteLookup(spriteLookups.fillColors);

					if (codeBlock === state.graphicHelper.draggedCodeBlock) {
						engine.drawSprite(0, 0, 'moduleBackgroundDragged', codeBlock.width, codeBlock.height);
					} else if (codeBlock.disabled) {
						engine.drawSprite(0, 0, 'moduleBackgroundDisabled', codeBlock.width, codeBlock.height);
					} else {
						engine.drawSprite(0, 0, 'moduleBackground', codeBlock.width, codeBlock.height);
					}

					drawBlockHighlights(engine, state, codeBlock);

					if (state.featureFlags.codeLineSelection && state.graphicHelper.selectedCodeBlock === codeBlock) {
						engine.drawSprite(0, codeBlock.cursor.y, 'highlightedCodeLine', codeBlock.width, state.viewport.hGrid);
					}

					engine.setSpriteLookup(
						state.graphicHelper.selectedCodeBlock === codeBlock ? spriteLookups.fontNumbers : spriteLookups.fontCode
					);

					engine.drawText(0, 0, corner);
					engine.drawText(codeBlock.width - state.viewport.vGrid, 0, corner);
					engine.drawText(0, codeBlock.height - state.viewport.hGrid, corner);
					engine.drawText(codeBlock.width - state.viewport.vGrid, codeBlock.height - state.viewport.hGrid, corner);

					engine.setSpriteLookup(spriteLookups.fontCode);

					if (codeBlock.disabled) {
						engine.setSpriteLookup(spriteLookups.fontDisabledCode);
					}

					for (let i = 0; i < codeBlock.codeToRender.length; i++) {
						for (let j = 0; j < codeBlock.codeToRender[i].length; j++) {
							const lookup = codeBlock.codeColors[i][j];
							if (!codeBlock.disabled && lookup) {
								engine.setSpriteLookup(lookup);
							}
							if (codeBlock.codeToRender[i][j] !== 32) {
								engine.drawSprite(
									state.viewport.vGrid * (j + 1),
									state.viewport.hGrid * i,
									codeBlock.codeToRender[i][j]
								);
							}
						}
					}

					if (state.featureFlags.editing && state.graphicHelper.selectedCodeBlock === codeBlock) {
						engine.drawText(codeBlock.cursor.x, codeBlock.cursor.y, '_');
					}

					drawPianoKeyboards(engine, state, codeBlock, memoryViews);
				},
				// Enable caching only when the block is NOT selected
				state.graphicHelper.selectedCodeBlock !== codeBlock,
				codeBlock.opacity
			);

			if (state.graphicHelper.selectedCodeBlock === codeBlock) {
				drawSelectedOutline(engine, state, codeBlock.width, codeBlock.height);
			}

			drawErrorMessages(engine, state, codeBlock);
			drawSwitches(engine, state, codeBlock, memoryViews);
			drawButtons(engine, state, codeBlock, memoryViews);
			drawSliders(engine, state, codeBlock, memoryViews);
			drawConnectors(engine, state, codeBlock, memoryViews);
			drawPlotters(engine, state, codeBlock, memoryViews);
			drawScanners(engine, state, codeBlock, memoryViews);
			drawDebuggers(engine, state, codeBlock, memoryViews);

			engine.endGroup();
		} else {
			// Module is off-screen, draw arrow indicators
			drawArrow(engine, codeBlock, state);
		}
	}

	engine.endGroup();
}
