import { PIANO_KEYBOARD_MIN_GRID_WIDTH } from './constants';

import type { DirectiveDerivedState, DirectiveWidgetContribution } from '../types';
import type { PianoDirectiveData } from './data';

import gapCalculator from '~/features/code-editing/gapCalculator';
import resolveMemoryIdentifier from '~/pureHelpers/resolveMemoryIdentifier';

type DirectiveWidgetResolver = NonNullable<DirectiveWidgetContribution['afterGraphicDataWidthCalculation']>;

function resolvePianoDirectiveWidget(
	pianoKeyboard: PianoDirectiveData,
	graphicData: Parameters<DirectiveWidgetResolver>[0],
	state: Parameters<DirectiveWidgetResolver>[1],
	directiveState: DirectiveDerivedState
): void {
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

	const displayRow =
		directiveState.displayModel.rawRowToDisplayRow[pianoKeyboard.lineNumber] ?? pianoKeyboard.lineNumber;

	graphicData.widgets.pianoKeyboards.push({
		x: 0,
		y: (gapCalculator(displayRow, graphicData.gaps) + 1) * state.viewport.hGrid,
		width: 24 * (state.viewport.vGrid * 2),
		height: state.viewport.hGrid * 5,
		keyWidth: state.viewport.vGrid * 2,
		pressedKeys: pianoKeyboard.pressedKeys,
		pressedKeysListMemory: memoryIdentifierKeysList.memory,
		pressedNumberOfKeysMemory: memoryIdentifierNumberOfKeys.memory,
		startingNumber: pianoKeyboard.startingNumber,
	});
}

export function createPianoDirectiveWidgetContribution(pianoKeyboard: PianoDirectiveData): DirectiveWidgetContribution {
	return {
		beforeGraphicDataWidthCalculation: graphicData => {
			graphicData.minGridWidth = PIANO_KEYBOARD_MIN_GRID_WIDTH;
		},
		afterGraphicDataWidthCalculation: (graphicData, state, directiveState) => {
			resolvePianoDirectiveWidget(pianoKeyboard, graphicData, state, directiveState);
		},
	};
}
