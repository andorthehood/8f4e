import { parsePianoKeyboards } from './codeParser';

import { gapCalculator } from '../../../../helpers/editor';
import resolveMemoryIdentifier from '../../../../helpers/resolveMemoryIdentifier';

import type { CodeBlockGraphicData, State } from '../../../../types';

export default function updatePianoKeyboardsGraphicData(graphicData: CodeBlockGraphicData, state: State) {
	graphicData.extras.pianoKeyboards.clear();
	parsePianoKeyboards(graphicData.code).forEach(pianoKeyboard => {
		const memoryIdentifierKeysList = resolveMemoryIdentifier(
			state,
			graphicData.id,
			pianoKeyboard.pressedKeysListMemoryId
		);
		const memoryIdentifierNumberOfKeys = resolveMemoryIdentifier(
			state,
			graphicData.id,
			pianoKeyboard.pressedNumberOfKeysMemoryId
		);

		if (!memoryIdentifierKeysList || !memoryIdentifierNumberOfKeys) {
			return;
		}

		graphicData.minGridWidth = 48;

		graphicData.extras.pianoKeyboards.set(pianoKeyboard.lineNumber, {
			x: 0,
			y: (gapCalculator(pianoKeyboard.lineNumber, graphicData.gaps) + 1) * state.graphicHelper.viewport.hGrid,
			width: 24 * (state.graphicHelper.viewport.vGrid * 2),
			height: state.graphicHelper.viewport.hGrid * 5,
			keyWidth: state.graphicHelper.viewport.vGrid * 2,
			pressedKeys: pianoKeyboard.pressedKeys,
			pressedKeysListMemory: memoryIdentifierKeysList.memory,
			pressedNumberOfKeysMemory: memoryIdentifierNumberOfKeys.memory,
			startingNumber: pianoKeyboard.startingNumber,
		});
	});
}
