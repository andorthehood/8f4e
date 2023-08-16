import { EventDispatcher } from '../../../events';
import findPianoKeyAtViewportCoordinates from '../../helpers/findPianoKeyboardAtViewportCoordinates';
import { ModuleGraphicData, State } from '../../types';
import { insertCodeAfterLine, replaceCode } from '../../helpers/multiLineCodeParser';

function generateCode(
	pressedKeys: Set<number>,
	pressedKeysListMemoryId: string,
	isInteger: boolean,
	startingNumber: number
) {
	return Array.from(pressedKeys).flatMap((key, index) => {
		const value = key + startingNumber;
		return [
			`push &${pressedKeysListMemoryId}`,
			`push WORD_SIZE`,
			`push ${index}`,
			`mul`,
			'add',
			`push ${isInteger ? value : `${value}.0`}`,
			`store`,
		];
	});
}

function removeCode(code: string[], pressedKeysListMemoryId: string) {
	const pattern = [
		`push &${pressedKeysListMemoryId}`,
		`push WORD_SIZE`,
		`push :index`,
		`mul`,
		'add',
		`push :key`,
		`store`,
	];

	return replaceCode(code, pattern, []);
}

export default function pianoKeyboard(state: State, events: EventDispatcher): () => void {
	const onModuleClick = function ({ x, y, module }: { x: number; y: number; module: ModuleGraphicData }) {
		const keyboard = findPianoKeyAtViewportCoordinates(state.graphicHelper, module, x, y);

		if (!keyboard) {
			return;
		}

		const key = Math.floor((x - (module.x - state.graphicHelper.viewport.x)) / keyboard.keyWidth);

		if (keyboard.pressedKeys.has(key)) {
			keyboard.pressedKeys.delete(key);
		} else {
			if (keyboard.pressedKeys.size === keyboard.pressedKeysListMemory.wordSize) {
				return;
			}
			keyboard.pressedKeys.add(key);
		}

		module.code[keyboard.pressedNumberOfKeysMemory.lineNumber] =
			'int ' + keyboard.pressedNumberOfKeysMemory.id + ' ' + keyboard.pressedKeys.size;

		module.code = insertCodeAfterLine(
			`piano ${keyboard.pressedKeysListMemory.id} ${keyboard.pressedNumberOfKeysMemory.id}`,
			removeCode(module.code, keyboard.pressedKeysListMemory.id),
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

	events.on('moduleClick', onModuleClick);
	//events.on('mouseup', onMouseUp);

	return () => {
		events.off('moduleClick', onModuleClick);
		//events.off('mouseup', onMouseUp);
	};
}
