import stdMathClampSource from './std/math/clamp.8f4e?raw';

const builtInFunctionSources: Record<string, string> = {
	'std/math/clamp': stdMathClampSource,
};

function getFunctionName(line: string): string {
	return line.trim().split(/\s+/)[1] ?? '';
}

function normalizeSourceLines(source: string): string[] {
	const lines = source.replace(/\r\n?/g, '\n').split('\n');
	return lines[lines.length - 1] === '' ? lines.slice(0, -1) : lines;
}

/**
 * Resolves a function include from the built-in 8f4e standard library sources.
 *
 * @param includeId - Logical built-in include id, such as `std/math/clamp`.
 * @returns Included function source, or undefined when the include id is unknown.
 */
export function resolveBuiltInFunctionInclude(includeId: string) {
	const source = builtInFunctionSources[includeId];
	if (!source) {
		return undefined;
	}

	const code = normalizeSourceLines(source);

	return {
		code,
		source: {
			kind: 'include' as const,
			includeId,
			symbolName: getFunctionName(code[0] ?? ''),
		},
	};
}
