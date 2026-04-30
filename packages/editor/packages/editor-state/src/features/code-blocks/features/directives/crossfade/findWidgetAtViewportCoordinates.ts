import type { CodeBlockGraphicData, Crossfade, State } from '@8f4e/editor-state-types';

export default function findCrossfadeWidgetAtViewportCoordinates(
	state: State,
	codeBlock: CodeBlockGraphicData,
	x: number,
	y: number
): Crossfade | undefined {
	return codeBlock.widgets.crossfades.find(crossfade => {
		return (
			x >= codeBlock.x + codeBlock.offsetX + crossfade.x - state.viewport.x &&
			x <= codeBlock.x + codeBlock.offsetX + crossfade.width + crossfade.x - state.viewport.x &&
			y >= codeBlock.y + codeBlock.offsetY + crossfade.y - state.viewport.y &&
			y <= codeBlock.y + codeBlock.offsetY + crossfade.height + crossfade.y - state.viewport.y
		);
	});
}
