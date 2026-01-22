import parsePianoKeyboards from './codeParser';

import { PIANO_KEYBOARD_MIN_GRID_WIDTH } from '../../utils/constants';

import type { CodeBlockGraphicData, State } from '~/types';

import gapCalculator from '~/features/code-editing/gapCalculator';
import resolveMemoryIdentifier from '~/pureHelpers/resolveMemoryIdentifier';

/**
 * Updates piano keyboard graphics for a code block.
 * Sets minGridWidth to PIANO_KEYBOARD_MIN_GRID_WIDTH (48) on the block if piano keyboards are present.
 */
export default function updatePianoKeyboardsGraphicData(graphicData: CodeBlockGraphicData, state: State): void {
	graphicData.extras.pianoKeyboards = [];
	let hasPianoKeyboard = false;

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

		hasPianoKeyboard = true;

		graphicData.extras.pianoKeyboards.push({
			x: 0,
			y: (gapCalculator(pianoKeyboard.lineNumber, graphicData.gaps) + 1) * state.viewport.hGrid,
			width: 24 * (state.viewport.vGrid * 2),
			height: state.viewport.hGrid * 5,
			keyWidth: state.viewport.vGrid * 2,
			pressedKeys: pianoKeyboard.pressedKeys,
			pressedKeysListMemory: memoryIdentifierKeysList.memory,
			pressedNumberOfKeysMemory: memoryIdentifierNumberOfKeys.memory,
			startingNumber: pianoKeyboard.startingNumber,
		});
	});

	if (hasPianoKeyboard) {
		graphicData.minGridWidth = PIANO_KEYBOARD_MIN_GRID_WIDTH;
	}
}
