import type { EditorRenderData } from '@8f4e/editor-render-projection';
import type { State } from '@8f4e/editor-state-types';
import type { DrawContext } from '../../drawContext';
import type { MemoryViews } from '../../types';
import drawArrow from './drawArrow';
import drawEntryOutlines from './drawEntryOutlines';
import drawSelectedLineHint from './drawSelectedLineHint';
import drawSelectedOutline from './drawSelectedOutline';
import drawShapeDeclarations from './drawShapeDeclarations';
import drawBars from './widgets/bars';
import drawBlockHighlights from './widgets/blockHighlights';
import drawButtons from './widgets/buttons';
import drawConnectors from './widgets/connectors';
import drawCrossfades from './widgets/crossfades';
import drawDebuggers from './widgets/debuggers';
import drawErrorMessages from './widgets/errorMessages';
import drawInfoPanels from './widgets/infoPanels';
import drawMeters from './widgets/meters';
import drawPianoKeyboards from './widgets/pianoKeyboards';
import drawPlotters from './widgets/plotters';
import drawSliders from './widgets/sliders';
import drawSwitches from './widgets/switches';
import drawWaves from './widgets/waves';

const corner = '+';

export default function drawModules(
	engine: DrawContext,
	state: State,
	memoryViews: MemoryViews,
	renderData: EditorRenderData
): void {
	const spriteLookups = state.spriteLookups;

	if (!spriteLookups) {
		return;
	}

	const { x, y } = state.viewport;

	const offsetX = -x;
	const offsetY = -y;

	engine.startGroup(offsetX, offsetY);
	drawEntryOutlines(engine, state);

	for (const codeBlock of state.codeBlockRendering.codeBlocks) {
		const codeCells = renderData.codeBlocks.get(codeBlock.creationIndex)?.codeCells ?? [];
		const renderHiddenPreview = codeBlock.hidden && !state.codeBlockRendering.showHiddenCodeBlocks;

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
			if (!renderHiddenPreview) {
				if (codeBlock === state.codeBlockRendering.draggedCodeBlock) {
					engine.drawSprite(0, 0, spriteLookups.fillColors.moduleBackgroundDragged, codeBlock.width, codeBlock.height);
				} else if (codeBlock.disabled) {
					engine.drawSprite(0, 0, spriteLookups.fillColors.moduleBackgroundDisabled, codeBlock.width, codeBlock.height);
				} else {
					engine.drawSprite(0, 0, spriteLookups.fillColors.moduleBackground, codeBlock.width, codeBlock.height);
				}

				drawBlockHighlights(engine, state, codeBlock);

				if (state.featureFlags.codeLineSelection && state.codeBlockRendering.selectedCodeBlock === codeBlock) {
					engine.drawSprite(
						0,
						codeBlock.cursor.y,
						spriteLookups.fillColors.highlightedCodeLine,
						codeBlock.width,
						state.viewport.hGrid
					);
				}
			}

			const cornerFont =
				state.codeBlockRendering.selectedCodeBlock === codeBlock ? spriteLookups.fontNumbers : spriteLookups.fontCode;

			engine.drawText(0, 0, corner, cornerFont);
			engine.drawText(codeBlock.width - state.viewport.vGrid, 0, corner, cornerFont);
			engine.drawText(0, codeBlock.height - state.viewport.hGrid, corner, cornerFont);
			engine.drawText(
				codeBlock.width - state.viewport.vGrid,
				codeBlock.height - state.viewport.hGrid,
				corner,
				cornerFont
			);

			if (!renderHiddenPreview) {
				for (let i = 0; i < codeCells.length; i++) {
					engine.drawResolvedText(state.viewport.vGrid, state.viewport.hGrid * i, codeCells[i]);
				}

				drawShapeDeclarations(engine, state, codeBlock);

				if (state.featureFlags.editing && state.codeBlockRendering.selectedCodeBlock === codeBlock) {
					engine.drawText(
						codeBlock.cursor.x,
						codeBlock.cursor.y,
						'_',
						codeBlock.disabled ? spriteLookups.fontDisabledCode : spriteLookups.fontCode
					);
				}
			}

			if (state.editorMode === 'presentation' && state.codeBlockRendering.selectedCodeBlock === codeBlock) {
				drawSelectedOutline(engine, state, codeBlock.width, codeBlock.height);
			}

			drawErrorMessages(engine, state, codeBlock);
			drawSwitches(engine, state, codeBlock, memoryViews);
			drawButtons(engine, state, codeBlock, memoryViews);
			drawSliders(engine, state, codeBlock, memoryViews);
			drawCrossfades(engine, state, codeBlock, memoryViews);
			drawPianoKeyboards(engine, state, codeBlock, memoryViews);
			drawConnectors(engine, state, codeBlock, memoryViews);
			drawBars(engine, state, codeBlock, memoryViews);
			drawMeters(engine, state, codeBlock, memoryViews);
			drawPlotters(engine, state, codeBlock, memoryViews);
			drawWaves(engine, state, codeBlock, memoryViews);
			drawInfoPanels(engine, state, codeBlock);
			drawDebuggers(engine, state, codeBlock, memoryViews);
			drawSelectedLineHint(engine, state, codeBlock, memoryViews);

			engine.endGroup();
		} else if (state.featureFlags.offscreenBlockArrows) {
			// Module is off-screen, draw arrow indicators
			drawArrow(engine, codeBlock, state);
		}
	}

	engine.endGroup();
}
