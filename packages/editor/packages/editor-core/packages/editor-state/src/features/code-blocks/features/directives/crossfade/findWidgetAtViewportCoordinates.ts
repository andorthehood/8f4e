import type { CodeBlockGraphicData, Crossfade, State } from '@8f4e/editor-state-types';

export default function findCrossfadeWidgetAtViewportCoordinates(
	state: State,
	codeBlock: CodeBlockGraphicData,
	x: number,
	y: number
): Crossfade | undefined {
	return codeBlock.widgets.crossfades.find(crossfade => {
		return (
			x >= codeBlock.x + crossfade.x - state.viewport.x &&
			x <= codeBlock.x + crossfade.width + crossfade.x - state.viewport.x &&
			y >= codeBlock.y + crossfade.y - state.viewport.y &&
			y <= codeBlock.y + crossfade.height + crossfade.y - state.viewport.y
		);
	});
}
