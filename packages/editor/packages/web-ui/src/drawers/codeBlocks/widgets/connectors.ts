import type { CodeBlockGraphicData, State } from '@8f4e/editor-state-types';
import { Icon } from '@8f4e/sprite-generator';
import type { DrawContext } from '../../../drawContext';
import type { MemoryViews } from '../../../types';

export default function drawConnectors(
	engine: DrawContext,
	state: State,
	codeBlock: CodeBlockGraphicData,
	memoryViews: MemoryViews
): void {
	if (!state.spriteLookups) {
		return;
	}

	for (const output of codeBlock.widgets.outputs) {
		const { x, y, memory } = output;

		const rawValue = memory.isInteger
			? memoryViews.int32[memory.wordAlignedAddress]
			: memory.isFloat64
				? memoryViews.float64[memory.byteAddress / 8]
				: memoryViews.float32[memory.wordAlignedAddress];
		const value = Number.isFinite(rawValue) ? rawValue : 0;

		output.calibratedMax = Math.max(1, output.calibratedMax, value);
		output.calibratedMin = Math.min(-1, output.calibratedMin, value);
		const scaleIndex = Math.max(
			0,
			Math.min(
				5,
				Math.round(((value - output.calibratedMin) / (output.calibratedMax + Math.abs(output.calibratedMin))) * 5)
			)
		);

		engine.drawSprite(
			x,
			y,
			state.spriteLookups.feedbackScale[scaleIndex] ?? state.spriteLookups.feedbackScale[0],
			state.viewport.vGrid * 3,
			state.viewport.hGrid
		);
	}

	for (const { x, y } of codeBlock.widgets.inputs) {
		engine.drawSprite(x, y, state.spriteLookups.icons[Icon.INPUT]);
	}
}
