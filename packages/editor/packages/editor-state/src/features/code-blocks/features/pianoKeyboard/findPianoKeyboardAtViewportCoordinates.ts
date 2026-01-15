import type { CodeBlockGraphicData, GraphicHelper, PianoKeyboard } from '~/types';

/**
 * Finds the piano keyboard widget inside a code block that encloses the provided viewport-relative point.
 * @param graphicHelper Graphic helper providing the current viewport origin.
 * @param codeBlock Code block whose piano keyboards should be tested.
 * @param x Viewport-relative x coordinate from a pointer event.
 * @param y Viewport-relative y coordinate from a pointer event.
 * @returns The intersecting piano keyboard metadata or `undefined` if the point is outside all keyboards.
 */
export default function findPianoKeyboardAtViewportCoordinates(
	graphicHelper: GraphicHelper,
	codeBlock: CodeBlockGraphicData,
	x: number,
	y: number
): PianoKeyboard | undefined {
	return codeBlock.extras.pianoKeyboards.find(pianoKeyboard => {
		return (
			x >= codeBlock.x + codeBlock.offsetX + pianoKeyboard.x - graphicHelper.viewport.x &&
			x <= codeBlock.x + codeBlock.offsetX + pianoKeyboard.width + pianoKeyboard.x - graphicHelper.viewport.x &&
			y >= codeBlock.y + codeBlock.offsetY + pianoKeyboard.y - graphicHelper.viewport.y &&
			y <= codeBlock.y + codeBlock.offsetY + pianoKeyboard.height + pianoKeyboard.y - graphicHelper.viewport.y
		);
	});
}
