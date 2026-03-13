import parsePressedKeys from './parsePressedKeys';

export interface PianoDirectiveData {
	id: string;
	lineNumber: number;
	pressedNumberOfKeysMemoryId: string;
	pressedKeysListMemoryId: string;
	pressedKeys: Set<number>;
	startingNumber: number;
}

export function createPianoDirectiveData(code: string[], args: string[], lineNumber: number): PianoDirectiveData {
	const startingNumber = parseInt(args[2] || '0', 10);
	const pressedKeys = parsePressedKeys(code, args[0], startingNumber);

	return {
		id: args[0],
		lineNumber,
		pressedNumberOfKeysMemoryId: args[1],
		pressedKeysListMemoryId: args[0],
		startingNumber,
		pressedKeys,
	};
}
