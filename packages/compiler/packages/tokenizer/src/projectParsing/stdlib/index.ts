const builtInFunctionSources: Record<string, string[]> = {
	'std/math/clamp': [
		'function clamp',
		'param float value',
		'param float minValue',
		'param float maxValue',
		'',
		'push value',
		'push minValue',
		'max',
		'push maxValue',
		'min',
		'',
		'functionEnd float',
	],
};

function getFunctionName(line: string): string {
	return line.trim().split(/\s+/)[1] ?? '';
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

	return {
		code: source,
		source: {
			kind: 'include' as const,
			includeId,
			symbolName: getFunctionName(source[0] ?? ''),
		},
	};
}
