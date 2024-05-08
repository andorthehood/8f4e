import { CodeBlockClickEvent } from '../../codeBlockDragger';
import { EventDispatcher } from '../../../../../events';
import findPianoKeyAtViewportCoordinates from '../../../../helpers/findPianoKeyboardAtViewportCoordinates';
import { State } from '../../../../types';
import { insertCodeAfterLine, replaceCode } from '../../../../helpers/multiLineCodeParser';

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

export default function pianoKeyboard(state: State, events: EventDispatcher): () => void {
	const onCodeBlockClick = function ({ x, y, codeBlock }: CodeBlockClickEvent) {
		const keyboard = findPianoKeyAtViewportCoordinates(state.graphicHelper, codeBlock, x, y);

		if (!keyboard) {
			return;
		}

		const key = Math.floor((x - (codeBlock.x - state.graphicHelper.activeViewport.viewport.x)) / keyboard.keyWidth);

		if (keyboard.pressedKeys.has(key)) {
			keyboard.pressedKeys.delete(key);
		} else {
			if (keyboard.pressedKeys.size === keyboard.pressedKeysListMemory.wordSpan) {
				return;
			}
			keyboard.pressedKeys.add(key);
		}

		const pressedNumberOfKeysMemoryLineNumber = codeBlock.code.findIndex(line => {
			line.startsWith('int ' + keyboard.pressedNumberOfKeysMemory.id);
		});

		codeBlock.code[pressedNumberOfKeysMemoryLineNumber] =
			'int ' + keyboard.pressedNumberOfKeysMemory.id + ' ' + keyboard.pressedKeys.size;

		codeBlock.code = insertCodeAfterLine(
			`piano ${keyboard.pressedKeysListMemory.id} ${keyboard.pressedNumberOfKeysMemory.id}`,
			removeCode(codeBlock.code, keyboard.pressedKeysListMemory.id),
			generateCode(
				keyboard.pressedKeys,
				keyboard.pressedKeysListMemory.id,
				keyboard.pressedKeysListMemory.isInteger,
				keyboard.startingNumber
			)
		);

		events.dispatch('saveState');
		events.dispatch('codeChange');
	};

	events.on('codeBlockClick', onCodeBlockClick);
	//events.on('mouseup', onMouseUp);

	return () => {
		events.off('codeBlockClick', onCodeBlockClick);
		//events.off('mouseup', onMouseUp);
	};
}
