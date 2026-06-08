import type { CodeBlockGraphicData, State } from '@8f4e/editor-state-types';
import type { Engine } from 'glugglug';

export default function drawShapeDeclarations(engine: Engine, state: State, codeBlock: CodeBlockGraphicData): void {
	if (!state.spriteLookups || codeBlock.widgets.shapeDeclarations.length === 0) {
		return;
	}

	engine.setSpriteLookup(codeBlock.disabled ? state.spriteLookups.fontDisabledCode : state.spriteLookups.fontCode);

	for (const { x, y, text } of codeBlock.widgets.shapeDeclarations) {
		engine.drawText(x, y, text);
	}
}
