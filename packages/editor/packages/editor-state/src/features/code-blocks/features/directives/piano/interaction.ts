import { StateManager } from '@8f4e/state-manager';

import findPianoKeyboardWidgetAtViewportCoordinates from './findWidgetAtViewportCoordinates';

import { CodeBlockClickEvent } from '../../codeBlockDragger/effect';
import replaceCode from '../../../utils/codeParsers/replaceCode';

import type { State } from '~/types';

import { EventDispatcher } from '~/types';

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

export default function pianoKeyboard(store: StateManager<State>, events: EventDispatcher): () => void {
	const state = store.getState();
	const onCodeBlockClick = function ({ x, y, codeBlock }: CodeBlockClickEvent) {
		const keyboard = findPianoKeyboardWidgetAtViewportCoordinates(state, codeBlock, x, y);

		if (!keyboard) {
			return;
		}

		const keyboardViewportX = codeBlock.x + codeBlock.offsetX + keyboard.x - state.viewport.x;
		const key = Math.floor((x - keyboardViewportX) / keyboard.keyWidth);

		if (keyboard.pressedKeys.has(key)) {
			keyboard.pressedKeys.delete(key);
		} else {
			if (keyboard.pressedKeys.size === keyboard.pressedKeysListMemory.wordAlignedSize) {
				return;
			}
			keyboard.pressedKeys.add(key);
		}

		const pressedNumberOfKeysMemoryLineNumber = findPressedNumberOfKeysMemoryLineNumber(
			codeBlock.code,
			keyboard.pressedNumberOfKeysMemory.id
		);

		if (pressedNumberOfKeysMemoryLineNumber === -1) {
			return;
		}

		codeBlock.code[pressedNumberOfKeysMemoryLineNumber] =
			'int ' + keyboard.pressedNumberOfKeysMemory.id + ' ' + keyboard.pressedKeys.size;

		const codeWithoutPressedKeyInitializers = removeCode(codeBlock.code, keyboard.pressedKeysListMemory.id);

		if (!codeWithoutPressedKeyInitializers[keyboard.lineNumber]) {
			return;
		}

		codeBlock.code = insertCodeAfterLineNumber(
			codeWithoutPressedKeyInitializers,
			keyboard.lineNumber,
			generateCode(
				keyboard.pressedKeys,
				keyboard.pressedKeysListMemory.id,
				keyboard.pressedKeysListMemory.isInteger,
				keyboard.startingNumber
			)
		);

		store.set('graphicHelper.selectedCodeBlock.code', codeBlock.code);
	};

	events.on('codeBlockClick', onCodeBlockClick);
	//events.on('mouseup', onMouseUp);

	return () => {
		events.off('codeBlockClick', onCodeBlockClick);
		//events.off('mouseup', onMouseUp);
	};
}
