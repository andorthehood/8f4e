import stdMathClampSource from './std/math/clamp.8f4e?raw';

const builtInFunctionSources: Record<string, string> = {
	'std/math/clamp': stdMathClampSource,
};

function getFunctionName(line: string): string {
	return line.trim().split(/\s+/)[1] ?? '';
}

function startsWithInstruction(line: string, instruction: string): boolean {
	const trimmed = line.trim();
	const nextCharacter = trimmed[instruction.length];
	return (
		trimmed === instruction || (trimmed.startsWith(instruction) && (nextCharacter === ' ' || nextCharacter === '\t'))
	);
}

function normalizeSourceLines(source: string): string[] {
	const lines = source.replace(/\r\n?/g, '\n').split('\n');
	return lines[lines.length - 1] === '' ? lines.slice(0, -1) : lines;
}

function splitFunctionBlocks(lines: string[]): string[][] {
	const blocks: string[][] = [];
	let currentBlock: string[] | undefined;

	for (const line of lines) {
		if (startsWithInstruction(line, 'function')) {
			currentBlock = [line];
			continue;
		}

		currentBlock?.push(line);

		if (startsWithInstruction(line, 'functionEnd')) {
			blocks.push(currentBlock ?? [line]);
			currentBlock = undefined;
		}
	}

	return blocks;
}

/**
 * Resolves a function include from the built-in 8f4e standard library sources.
 *
 * @param includeId - Logical built-in include id, such as `std/math/clamp`.
 * @returns Included function sources, or undefined when the include id is unknown.
 */
export function resolveBuiltInFunctionIncludes(includeId: string) {
	const source = builtInFunctionSources[includeId];
	if (!source) {
		return undefined;
	}

	return splitFunctionBlocks(normalizeSourceLines(source)).map(code => ({
		code,
		source: {
			kind: 'include' as const,
			includeId,
			symbolName: getFunctionName(code[0] ?? ''),
		},
	}));
}
