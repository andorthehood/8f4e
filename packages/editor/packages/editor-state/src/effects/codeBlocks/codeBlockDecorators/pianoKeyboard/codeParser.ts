import { instructionParser } from '@8f4e/compiler/syntax';

import { parsePressedKeys } from './parsePressedKeys';

export function parsePianoKeyboards(code: string[]) {
	return code.reduce(
		(acc, line, index) => {
			const [, instruction, ...args] = (line.match(instructionParser) ?? []) as [never, string, string, string, string];

			if (instruction === 'piano') {
				const startingNumber = parseInt(args[2] || '0', 10);
				const pressedKeys = parsePressedKeys(code, args[0], startingNumber);

				return [
					...acc,
					{
						id: args[0],
						lineNumber: index,
						pressedNumberOfKeysMemoryId: args[1],
						pressedKeysListMemoryId: args[0],
						startingNumber,
						pressedKeys,
					},
				];
			}
			return acc;
		},
		[] as Array<{
			id: string;
			lineNumber: number;
			pressedNumberOfKeysMemoryId: string;
			pressedKeysListMemoryId: string;
			pressedKeys: Set<number>;
			startingNumber: number;
		}>
	);
}
