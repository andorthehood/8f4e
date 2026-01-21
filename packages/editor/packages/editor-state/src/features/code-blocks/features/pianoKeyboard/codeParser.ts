import { instructionParser } from '@8f4e/compiler/syntax';

import parsePressedKeys from './parsePressedKeys';

export default function parsePianoKeyboards(code: string[]) {
	return code.reduce(
		(acc, line, index) => {
			const [, instruction, ...args] = (line.match(instructionParser) ?? []) as [
				never,
				string,
				string,
				string,
				string,
				string,
			];

			if (instruction === '#' && args[0] === 'piano') {
				const startingNumber = parseInt(args[3] || '0', 10);
				const pressedKeys = parsePressedKeys(code, args[1], startingNumber);

				return [
					...acc,
					{
						id: args[1],
						lineNumber: index,
						pressedNumberOfKeysMemoryId: args[2],
						pressedKeysListMemoryId: args[1],
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
