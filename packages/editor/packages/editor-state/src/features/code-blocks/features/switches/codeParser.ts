import { instructionParser } from '@8f4e/compiler/syntax';

export default function parseSwitches(code: string[]) {
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

			if (instruction === '#' && args[0] === 'switch') {
				return [
					...acc,
					{ id: args[1], lineNumber: index, onValue: parseInt(args[3], 10) || 1, offValue: parseInt(args[2], 10) || 0 },
				];
			}
			return acc;
		},
		[] as Array<{ id: string; lineNumber: number; onValue: number; offValue: number }>
	);
}
