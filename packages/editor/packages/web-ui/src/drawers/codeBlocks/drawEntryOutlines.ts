import type { CodeBlockEntryOutline, State } from '@8f4e/editor-state-types';
import type { Engine } from 'glugglug';

function drawOutline(engine: Engine, outline: CodeBlockEntryOutline, thickness: number): void {
	const left = outline.topLeft.x;
	const top = outline.topLeft.y;
	const width = outline.topRight.x - outline.topLeft.x;
	const height = outline.bottomLeft.y - outline.topLeft.y;
	const bottom = outline.bottomLeft.y - thickness;
	const right = outline.topRight.x - thickness;

	engine.drawSprite(left, top, 'wire', width, thickness);
	engine.drawSprite(left, bottom, 'wire', width, thickness);
	engine.drawSprite(left, top, 'wire', thickness, height);
	engine.drawSprite(right, top, 'wire', thickness, height);
}

export default function drawEntryOutlines(engine: Engine, state: State): void {
	if (!state.spriteLookups) {
		return;
	}

	const thickness = 1;

	engine.setSpriteLookup(state.spriteLookups.fillColors);

	for (const outline of state.codeBlockRendering.entryOutlines) {
		drawOutline(engine, outline, thickness);
	}
}
