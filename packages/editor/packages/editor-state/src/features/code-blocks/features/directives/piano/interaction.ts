import { StateManager } from '@8f4e/state-manager';

import findPianoKeyboardWidgetAtViewportCoordinates from './findWidgetAtViewportCoordinates';

import { CodeBlockClickEvent } from '../../codeBlockDragger/effect';
import replaceCode from '../../../utils/codeParsers/replaceCode';

import type { CodeBlockGraphicData, PianoKeyboard, State } from '~/types';

import { EventDispatcher } from '~/types';

// Data flow must stay one-way:
// UI key press -> edits code -> runtime updates memory -> UI reflects memory.
// Pressed keys may also come from another program writing the pressed-key memory buffer,
// so rendering must never treat code or interaction state as the source of truth.
function generateCode(
	pressedKeys: Set<number>,
	pressedKeysListMemoryId: string,
	isInteger: boolean,
	startingNumber: number
) {
	return Array.from(pressedKeys).flatMap((key, index) => {
		const value = key + startingNumber;
		return [`init ${pressedKeysListMemoryId}[${index}] ${isInteger ? value : `${value}.0`}`];
	});
}

function removeCode(code: string[], pressedKeysListMemoryId: string) {
	const pattern = [`init ${pressedKeysListMemoryId}[:index] :key`];

	return replaceCode(code, pattern, []);
}

function escapeRegExp(text: string): string {
	return text.replaceAll(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function findPressedNumberOfKeysMemoryLineNumber(code: string[], memoryId: string): number {
	const regexp = new RegExp(`^\\s*int\\s+${escapeRegExp(memoryId)}\\s+`);

	return code.findIndex(line => regexp.test(line));
}

function insertCodeAfterLineNumber(code: string[], lineNumber: number, codeToInsert: string[]): string[] {
	const indexToInsert = lineNumber + 1;

	return [...code.slice(0, indexToInsert), ...codeToInsert, ...code.slice(indexToInsert)];
}

function readRuntimePressedKeys(state: State, keyboard: PianoKeyboard): Set<number> {
	const pressedKeys = new Set<number>();
	const getWordFromMemory = state.callbacks?.getWordFromMemory;

	if (!getWordFromMemory) {
		return pressedKeys;
	}

	const numberOfKeys = Math.max(0, getWordFromMemory(keyboard.pressedNumberOfKeysMemory.wordAlignedAddress) || 0);
	const readableKeys = Math.min(numberOfKeys, keyboard.pressedKeysListMemory.wordAlignedSize);

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
			if (pressedKeys.size === keyboard.pressedKeysListMemory.wordAlignedSize) {
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

		codeBlock.code[pressedNumberOfKeysMemoryLineNumber] =
			'int ' + keyboard.pressedNumberOfKeysMemory.id + ' ' + pressedKeys.size;

		const codeWithoutPressedKeyInitializers = removeCode(codeBlock.code, keyboard.pressedKeysListMemory.id);

		if (!codeWithoutPressedKeyInitializers[keyboard.lineNumber]) {
			return;
		}

		codeBlock.code = insertCodeAfterLineNumber(
			codeWithoutPressedKeyInitializers,
			keyboard.lineNumber,
			generateCode(
				pressedKeys,
				keyboard.pressedKeysListMemory.id,
				keyboard.pressedKeysListMemory.isInteger,
				keyboard.startingNumber
			)
		);

		store.set('graphicHelper.selectedCodeBlock.code', codeBlock.code);
	};

	events.on('codeBlockClick', onCodeBlockClick);

	return () => {
		events.off('codeBlockClick', onCodeBlockClick);
	};
}
