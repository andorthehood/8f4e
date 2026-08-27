import { isMemoryTarget, parseInteger } from '~/shared/editorDirectiveArgumentTypes';

export interface PianoDirectiveData {
	id: string;
	lineNumber: number;
	pressedNumberOfKeysMemoryId: string;
	pressedKeysListMemoryId: string;
	startingNumber: number;
}

export function createPianoDirectiveData(args: string[], lineNumber: number): PianoDirectiveData | undefined {
	if ((args.length !== 2 && args.length !== 3) || !isMemoryTarget(args[0]) || !isMemoryTarget(args[1])) {
		return undefined;
	}

	const startingNumber = args[2] === undefined ? 0 : parseInteger(args[2]);
	if (startingNumber === undefined || startingNumber < 0) {
		return undefined;
	}

	return {
		id: args[0],
		lineNumber,
		pressedNumberOfKeysMemoryId: args[1],
		pressedKeysListMemoryId: args[0],
		startingNumber,
	};
}
