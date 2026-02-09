import parsePressedKeys from './parsePressedKeys';

export default function parsePianoKeyboards(code: string[]) {
	return code.reduce(
		(acc, line, index) => {
			// Match semicolon comment lines with @piano directive
			const commentMatch = line.match(/^\s*;\s*@(\w+)\s+(.*)/);
			if (commentMatch && commentMatch[1] === 'piano') {
				const args = commentMatch[2].trim().split(/\s+/);
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
