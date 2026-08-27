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
			x >= codeBlock.x + codeBlock.offsetX + pianoKeyboard.x - state.viewport.x &&
			x <= codeBlock.x + codeBlock.offsetX + pianoKeyboard.width + pianoKeyboard.x - state.viewport.x &&
			y >= codeBlock.y + codeBlock.offsetY + pianoKeyboard.y - state.viewport.y &&
			y <= codeBlock.y + codeBlock.offsetY + pianoKeyboard.height + pianoKeyboard.y - state.viewport.y
		);
	});
}
