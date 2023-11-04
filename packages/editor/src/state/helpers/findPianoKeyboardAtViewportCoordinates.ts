import { GraphicHelper, CodeBlockGraphicData, PianoKeyboard } from '../types';

export default function findPianoKeyboardAtViewportCoordinates(
	graphicHelper: GraphicHelper,
	module: CodeBlockGraphicData,
	x: number,
	y: number
): PianoKeyboard | undefined {
	return Array.from(module.pianoKeyboards.values()).find(pianoKeyboard => {
		return (
			x >= module.x + module.offsetX + pianoKeyboard.x - graphicHelper.viewport.x &&
			x <= module.x + module.offsetX + pianoKeyboard.width + pianoKeyboard.x - graphicHelper.viewport.x &&
			y >= module.y + module.offsetY + pianoKeyboard.y - graphicHelper.viewport.y &&
			y <= module.y + module.offsetY + pianoKeyboard.height + pianoKeyboard.y - graphicHelper.viewport.y
		);
	});
}
