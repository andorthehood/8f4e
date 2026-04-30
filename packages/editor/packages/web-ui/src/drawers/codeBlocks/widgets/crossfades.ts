import { Engine } from 'glugglug';

import type { CodeBlockGraphicData, State } from '@8f4e/editor-state-types';
import type { MemoryViews } from '../../../types';

function clamp(value: number, min: number, max: number): number {
	return Math.max(min, Math.min(value, max));
}

export default function drawer(
	engine: Engine,
	state: State,
	codeBlock: CodeBlockGraphicData,
	memoryViews: MemoryViews
): void {
	if (!state.graphicHelper.spriteLookups || !codeBlock.moduleId) {
		return;
	}

	for (const crossfade of codeBlock.widgets.crossfades) {
		const leftValue = clamp(memoryViews.float32[crossfade.leftWordAddress] ?? 0, 0, 1);
		const rightValue = clamp(memoryViews.float32[crossfade.rightWordAddress] ?? 0, 0, 1);
		const position = clamp(rightValue - leftValue, -1, 1);
		const handleX = Math.round(((position + 1) / 2) * crossfade.trackWidth);

		engine.startGroup(crossfade.x, crossfade.y);
		engine.setSpriteLookup(state.graphicHelper.spriteLookups.fillColors);
		engine.drawSprite(0, 0, 'track', crossfade.width, crossfade.height);

		if (handleX !== crossfade.centerX) {
			const fillX = Math.min(crossfade.centerX, handleX);
			const fillWidth = Math.abs(handleX - crossfade.centerX) + crossfade.handleWidth;
			engine.drawSprite(fillX, 0, 'fill', fillWidth, crossfade.height);
		}

		engine.drawSprite(handleX, 0, 'handle', crossfade.handleWidth, crossfade.height);
		engine.endGroup();
	}
}
