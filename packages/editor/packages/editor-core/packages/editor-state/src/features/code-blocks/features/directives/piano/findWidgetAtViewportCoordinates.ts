import type { CodeBlockGraphicData, PianoKeyboard, State } from '@8f4e/editor-state-types';

/**
 * Finds the piano keyboard widget inside a code block that encloses the provided viewport-relative point.
 */
export default function findPianoKeyboardWidgetAtViewportCoordinates(
	state: State,
	codeBlock: CodeBlockGraphicData,
	x: number,
	y: number
): PianoKeyboard | undefined {
	return codeBlock.widgets.pianoKeyboards.find(pianoKeyboard => {
		return (
			x >= codeBlock.x + pianoKeyboard.x - state.viewport.x &&
			x <= codeBlock.x + pianoKeyboard.width + pianoKeyboard.x - state.viewport.x &&
			y >= codeBlock.y + pianoKeyboard.y - state.viewport.y &&
			y <= codeBlock.y + pianoKeyboard.height + pianoKeyboard.y - state.viewport.y
		);
	});
}
