import { StateManager } from '@8f4e/state-manager';

import findPianoKeyboardWidgetAtViewportCoordinates from './findWidgetAtViewportCoordinates';

import { CodeBlockClickEvent } from '../../codeBlockDragger/effect';

import type { CodeBlockGraphicData, PianoKeyboard, State } from '~/types';

import { EventDispatcher } from '~/types';

// Data flow must stay one-way:
// UI key press -> edits code -> runtime updates memory -> UI reflects memory.
// Pressed keys may also come from another program writing the pressed-key memory buffer,
// so rendering must never treat code or interaction state as the source of truth.
function escapeRegExp(text: string): string {
	return text.replaceAll(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function findPressedNumberOfKeysMemoryLineNumber(code: string[], memoryId: string): number {
	const regexp = new RegExp(`^\\s*int\\s+${escapeRegExp(memoryId)}\\s+`);

	return code.findIndex(line => regexp.test(line));
}

function formatMemoryValue(value: number, isInteger: boolean): string {
	return isInteger ? `${value}` : `${value}.0`;
}

function createArrayDeclarationRegexp(memoryId: string): RegExp {
	return new RegExp(
		`^(?<prefix>\\s*(?:int8u?|int16u?|int32|int|float64|float)\\*{0,2}\\[\\]\\s+${escapeRegExp(
			memoryId
		)}\\s+)(?<elementCount>\\S+)(?:\\s+[^;]*?)?(?<comment>\\s*;.*)?\\s*$`
	);
}

function findPressedKeysListMemoryLineNumber(code: string[], memoryId: string): number {
	const regexp = createArrayDeclarationRegexp(memoryId);

	return code.findIndex(line => regexp.test(line));
}

function updatePressedKeysListMemoryDefaultValues(
	code: string[],
	pressedKeysListMemoryId: string,
	pressedKeys: Set<number>,
	isInteger: boolean,
	startingNumber: number
): string[] | undefined {
	const lineNumber = findPressedKeysListMemoryLineNumber(code, pressedKeysListMemoryId);
	if (lineNumber === -1) {
		return undefined;
	}

	const line = code[lineNumber];
	const groups = createArrayDeclarationRegexp(pressedKeysListMemoryId).exec(line)?.groups;
	if (!groups?.prefix || !groups.elementCount) {
		return undefined;
	}

	const defaultValues = Array.from(pressedKeys).map(key => formatMemoryValue(key + startingNumber, isInteger));
	const serializedDefaultValues = defaultValues.length > 0 ? ` ${defaultValues.join(' ')}` : '';

	const updatedCode = [...code];
	updatedCode[lineNumber] = `${groups.prefix}${groups.elementCount}${serializedDefaultValues}${groups.comment ?? ''}`;

	return updatedCode;
}

function readRuntimePressedKeys(state: State, keyboard: PianoKeyboard): Set<number> {
	const pressedKeys = new Set<number>();
	const getWordFromMemory = state.callbacks?.getWordFromMemory;

	if (!getWordFromMemory) {
		return pressedKeys;
	}

	const numberOfKeys = Math.max(0, getWordFromMemory(keyboard.pressedNumberOfKeysMemory.wordAlignedAddress) || 0);
	const readableKeys = Math.min(numberOfKeys, keyboard.pressedKeysListMemory.numberOfElements);

	for (let i = 0; i < readableKeys; i++) {
		const keyValue = getWordFromMemory(keyboard.pressedKeysListMemory.wordAlignedAddress + i);
		const keyOffset = Math.trunc(keyValue - keyboard.startingNumber);

		if (keyOffset >= 0 && keyOffset < keyboard.keys.length) {
			pressedKeys.add(keyOffset);
		}
	}

	return pressedKeys;
}

function getClickedKeyOffset(
	state: State,
	codeBlock: CodeBlockGraphicData,
	keyboard: PianoKeyboard,
	x: number
): number {
	const keyboardViewportX = codeBlock.x + codeBlock.offsetX + keyboard.x - state.viewport.x;

	return Math.floor((x - keyboardViewportX) / keyboard.keyWidth);
}

export default function pianoKeyboard(store: StateManager<State>, events: EventDispatcher): () => void {
	const state = store.getState();
	const onCodeBlockClick = function ({ x, y, codeBlock }: CodeBlockClickEvent) {
		const keyboard = findPianoKeyboardWidgetAtViewportCoordinates(state, codeBlock, x, y);

		if (!keyboard) {
			return;
		}

		const key = getClickedKeyOffset(state, codeBlock, keyboard, x);
		if (key < 0 || key >= keyboard.keys.length) {
			return;
		}

		const pressedKeys = readRuntimePressedKeys(state, keyboard);
		if (pressedKeys.has(key)) {
			pressedKeys.delete(key);
		} else {
			if (pressedKeys.size === keyboard.pressedKeysListMemory.numberOfElements) {
				return;
			}
			pressedKeys.add(key);
		}

		const pressedNumberOfKeysMemoryLineNumber = findPressedNumberOfKeysMemoryLineNumber(
			codeBlock.code,
			keyboard.pressedNumberOfKeysMemory.id
		);

		if (pressedNumberOfKeysMemoryLineNumber === -1) {
			return;
		}

		const updatedCode = [...codeBlock.code];
		updatedCode[pressedNumberOfKeysMemoryLineNumber] =
			'int ' + keyboard.pressedNumberOfKeysMemory.id + ' ' + pressedKeys.size;

		const codeWithUpdatedDefaults = updatePressedKeysListMemoryDefaultValues(
			updatedCode,
			keyboard.pressedKeysListMemory.id,
			pressedKeys,
			keyboard.pressedKeysListMemory.isInteger,
			keyboard.startingNumber
		);
		if (!codeWithUpdatedDefaults) {
			return;
		}

		codeBlock.code = codeWithUpdatedDefaults;

		store.set('graphicHelper.selectedCodeBlock.code', codeBlock.code);
	};

	events.on('codeBlockClick', onCodeBlockClick);

	return () => {
		events.off('codeBlockClick', onCodeBlockClick);
	};
}
