import type { CodeBlockGraphicData, State } from '@8f4e/editor-state-types';
import type { DrawContext } from '../../../drawContext';
import type { MemoryViews } from '../../../types';

function clamp(value: number, min: number, max: number): number {
	return Math.max(min, Math.min(value, max));
}

export default function drawer(
	engine: DrawContext,
	state: State,
	codeBlock: CodeBlockGraphicData,
	memoryViews: MemoryViews
): void {
	if (!state.spriteLookups || !codeBlock.name) {
		return;
	}

	for (const crossfade of codeBlock.widgets.crossfades) {
		const leftValue = clamp(memoryViews.float32[crossfade.leftWordAddress] ?? 0, 0, 1);
		const rightValue = clamp(memoryViews.float32[crossfade.rightWordAddress] ?? 0, 0, 1);
		const position = clamp(rightValue - leftValue, -1, 1);
		const handleX = Math.round(((position + 1) / 2) * crossfade.trackWidth);

		engine.pushOffset(crossfade.x, crossfade.y);
		engine.drawSprite(0, 0, state.spriteLookups.fillColors.track, crossfade.width, crossfade.height);

		if (handleX !== crossfade.centerX) {
			const fillX = Math.min(crossfade.centerX, handleX);
			const fillWidth = Math.abs(handleX - crossfade.centerX) + crossfade.handleWidth;
			engine.drawSprite(fillX, 0, state.spriteLookups.fillColors.fill, fillWidth, crossfade.height);
		}

		engine.drawSprite(handleX, 0, state.spriteLookups.fillColors.handle, crossfade.handleWidth, crossfade.height);
		engine.popOffset();
	}
}
