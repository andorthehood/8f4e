export interface PianoDirectiveData {
	id: string;
	lineNumber: number;
	pressedNumberOfKeysMemoryId: string;
	pressedKeysListMemoryId: string;
	startingNumber: number;
}

export function createPianoDirectiveData(
	code: string[],
	args: string[],
	lineNumber: number
): PianoDirectiveData | undefined {
	if (!args[0] || !args[1]) {
		return undefined;
	}

	const startingNumber = parseInt(args[2] || '0', 10);

	return {
		id: args[0],
		lineNumber,
		pressedNumberOfKeysMemoryId: args[1],
		pressedKeysListMemoryId: args[0],
		startingNumber,
	};
}
