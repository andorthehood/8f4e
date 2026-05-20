import type { Engine } from 'glugglug';
import type { CodeBlockGraphicData, State } from '@8f4e/editor-state-types';

export default function drawSelectedLineHint(engine: Engine, state: State, codeBlock: CodeBlockGraphicData): void {
	const spriteLookups = state.graphicHelper.spriteLookups;
	const lines = state.tooltip.text;

	if (
		!spriteLookups ||
		lines.length === 0 ||
		!state.featureFlags.codeLineSelection ||
		state.graphicHelper.selectedCodeBlock !== codeBlock
	) {
		return;
	}

	const { vGrid, hGrid } = state.viewport;
	const x = codeBlock.width + vGrid;
	const y = codeBlock.cursor.y;
	const width = (Math.max(...lines.map(line => line.length)) + 2) * vGrid;
	const height = lines.length * hGrid;

	engine.setSpriteLookup(spriteLookups.fillColors);
	engine.drawSprite(x, y, 'debugInfoBackground', width, height);

	engine.setSpriteLookup(spriteLookups.fontCode);
	lines.forEach((line, index) => {
		engine.drawText(x + vGrid, y + index * hGrid, line);
	});
}
