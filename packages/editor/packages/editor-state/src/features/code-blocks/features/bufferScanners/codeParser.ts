import { instructionParser } from '@8f4e/compiler/syntax';

export default function parseBufferScanners(code: string[]) {
	return code.reduce(
		(acc, line, index) => {
			const [, instruction, ...args] = (line.match(instructionParser) ?? []) as [never, string, string, string];

			if (instruction === 'scan') {
				return [
					...acc,
					{
						bufferMemoryId: args[0],
						pointerMemoryId: args[1],
						lineNumber: index,
					},
				];
			}

			return acc;
		},
		[] as Array<{
			bufferMemoryId: string;
			pointerMemoryId: string;
			lineNumber: number;
		}>
	);
}
