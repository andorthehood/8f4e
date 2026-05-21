import type { Engine } from 'glugglug';
import type { CodeBlockGraphicData, State } from '@8f4e/editor-state-types';
import type { SpriteLookup } from 'glugglug';

const horizontalPaddingChars = 1;

function drawTextWithColors(
	engine: Engine,
	state: State,
	text: string,
	colors: Array<SpriteLookup | undefined>,
	x: number,
	y: number
): void {
	const spriteLookups = state.graphicHelper.spriteLookups!;
	let segmentStart = 0;
	let currentLookup = colors[0] ?? spriteLookups.fontTooltipText;

	engine.setSpriteLookup(currentLookup);

	for (let index = 1; index < text.length; index++) {
		const nextLookup = colors[index];

		if (!nextLookup || nextLookup === currentLookup) {
			continue;
		}

		engine.drawText(x + segmentStart * state.viewport.vGrid, y, text.slice(segmentStart, index));
		engine.setSpriteLookup(nextLookup);
		currentLookup = nextLookup;
		segmentStart = index;
	}

	if (segmentStart < text.length) {
		engine.drawText(x + segmentStart * state.viewport.vGrid, y, text.slice(segmentStart));
	}
}

export default function drawSelectedLineHint(engine: Engine, state: State, codeBlock: CodeBlockGraphicData): void {
	const spriteLookups = state.graphicHelper.spriteLookups;

	if (!spriteLookups || !state.featureFlags.codeLineSelection || state.graphicHelper.selectedCodeBlock !== codeBlock) {
		return;
	}

	if (state.tooltip.text.length === 0) {
		return;
	}

	const { vGrid, hGrid } = state.viewport;
	const horizontalPadding = horizontalPaddingChars * vGrid;
	let maxLineLength = 0;

	for (let index = 0; index < state.tooltip.text.length; index++) {
		maxLineLength = Math.max(maxLineLength, state.tooltip.text[index].length);
	}

	const width = (maxLineLength + horizontalPaddingChars * 2) * vGrid;
	const height = state.tooltip.text.length * hGrid;
	const x = -width - vGrid;
	const y = codeBlock.cursor.y;

	engine.setSpriteLookup(spriteLookups.fillColors);
	engine.drawSprite(x, y, 'tooltipBackground', width, height);

	for (let index = 0; index < state.tooltip.text.length; index++) {
		const line = state.tooltip.text[index];
		const lineX = x + horizontalPadding;
		const lineY = y + index * hGrid;

		drawTextWithColors(engine, state, line, state.tooltip.colors[index] ?? [], lineX, lineY);
	}
}
