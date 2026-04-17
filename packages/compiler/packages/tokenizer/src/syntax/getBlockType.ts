export type CodeBlockType = 'module' | 'function' | 'constants' | 'unknown';

const BLOCK_MARKERS: Array<{
	type: Exclude<CodeBlockType, 'unknown'>;
	opener: RegExp;
	closer: RegExp;
}> = [
	{ type: 'module', opener: /^\s*module(\s|$)/, closer: /^\s*moduleEnd(\s|$)/ },
	{
		type: 'function',
		opener: /^\s*function(\s|$)/,
		closer: /^\s*functionEnd(\s|$)/,
	},
	{
		type: 'constants',
		opener: /^\s*constants(\s|$)/,
		closer: /^\s*constantsEnd(\s|$)/,
	},
];

/**
 * Detects whether a block of code represents a module, function, constants, or unknown block by scanning for marker pairs.
 * @param code - Code block represented as an array of lines.
 * @returns The inferred code block type.
 */
export function getBlockType(code: string[]): CodeBlockType {
	const markerMatches = BLOCK_MARKERS.map(({ type, opener, closer }) => ({
		type,
		hasOpener: code.some(line => opener.test(line)),
		hasCloser: code.some(line => closer.test(line)),
	}));
	const presentTypes = markerMatches.filter(({ hasOpener, hasCloser }) => hasOpener || hasCloser);

	if (presentTypes.length !== 1) {
		return 'unknown';
	}

	const [match] = presentTypes;
	return match.hasOpener && match.hasCloser ? match.type : 'unknown';
}

/**
 * Returns true if the given block type is accepted as a direct input to the compiler
 * (modules, functions, constants, and macros).
 * Constants blocks are treated as modules by the compiler.
 * Accepts undefined for safe use with optional chaining.
 */
export function isCompilableBlockType(
	blockType: string | undefined
): blockType is 'module' | 'function' | 'constants' | 'macro' {
	return blockType === 'module' || blockType === 'function' || blockType === 'constants' || blockType === 'macro';
}
