import type { CodeBlockGraphicData, GraphicHelper, PianoKeyboard } from '../types';

export default function findPianoKeyboardAtViewportCoordinates(
	graphicHelper: GraphicHelper,
	codeBlock: CodeBlockGraphicData,
	x: number,
	y: number
): PianoKeyboard | undefined {
	return Array.from(codeBlock.extras.pianoKeyboards.values()).find(pianoKeyboard => {
		return (
			x >= codeBlock.x + codeBlock.offsetX + pianoKeyboard.x - graphicHelper.activeViewport.viewport.x &&
			x <=
				codeBlock.x +
					codeBlock.offsetX +
					pianoKeyboard.width +
					pianoKeyboard.x -
					graphicHelper.activeViewport.viewport.x &&
			y >= codeBlock.y + codeBlock.offsetY + pianoKeyboard.y - graphicHelper.activeViewport.viewport.y &&
			y <=
				codeBlock.y +
					codeBlock.offsetY +
					pianoKeyboard.height +
					pianoKeyboard.y -
					graphicHelper.activeViewport.viewport.y
		);
	});
}
