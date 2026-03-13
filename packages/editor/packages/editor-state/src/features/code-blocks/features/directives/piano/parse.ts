import parsePressedKeys from '../../pianoKeyboard/parsePressedKeys';

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

export default function parsePianoDirectives(code: string[]): PianoDirectiveData[] {
	return code.reduce((acc, line, index) => {
		const commentMatch = line.match(/^\s*;\s*@(\w+)\s+(.*)/);
		if (commentMatch && commentMatch[1] === 'piano') {
			const args = commentMatch[2].trim().split(/\s+/);

			return [...acc, createPianoDirectiveData(code, args, index)];
		}
		return acc;
	}, [] as PianoDirectiveData[]);
}
