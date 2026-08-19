import type { CodeBlockGraphicData, State } from '@8f4e/editor-state-types';
import type { DrawContext } from '../../../drawContext';
import type { MemoryViews } from '../../../types';

export default function drawer(
	engine: DrawContext,
	state: State,
	codeBlock: CodeBlockGraphicData,
	memoryViews: MemoryViews
): void {
	if (!state.spriteLookups) {
		return;
	}

	for (const { x, y, width, height, wordAlignedAddress, byteAddress, isInteger, isFloat64, min, max } of codeBlock
		.widgets.sliders) {
		const value = isInteger
			? memoryViews.int32[wordAlignedAddress]
			: isFloat64
				? memoryViews.float64[byteAddress / 8]
				: memoryViews.float32[wordAlignedAddress];

		// Handle edge case where min equals max
		if (min === max) {
			continue;
		}

		// Calculate normalized position (0..1)
		const normalizedValue = Math.max(0, Math.min(1, (value - min) / (max - min)));
		const handleWidth = Math.min(state.viewport.vGrid, width);
		const trackWidth = Math.max(width - handleWidth, 1);
		const handleX = Math.floor(normalizedValue * trackWidth);

		engine.pushOffset(x, y);

		engine.drawSprite(0, 0, state.spriteLookups.fillColors.track, width, height);
		engine.drawSprite(0, 0, state.spriteLookups.fillColors.fill, handleX + handleWidth, height);
		engine.drawSprite(handleX, 0, state.spriteLookups.fillColors.handle, handleWidth, height);

		engine.popOffset();
	}
}
