export type CodeBlockType = 'module' | 'function' | 'constants' | 'unknown';

/**
 * Detects whether a block of code represents a module, function, constants, or unknown block by scanning for marker pairs.
 * @param code - Code block represented as an array of lines.
 * @returns The inferred code block type.
 */
export function getBlockType(code: string[]): CodeBlockType {
	const hasModule = code.some(line => /^\s*module(\s|$)/.test(line));
	const hasModuleEnd = code.some(line => /^\s*moduleEnd(\s|$)/.test(line));
	const hasFunction = code.some(line => /^\s*function(\s|$)/.test(line));
	const hasFunctionEnd = code.some(line => /^\s*functionEnd(\s|$)/.test(line));
	const hasConstants = code.some(line => /^\s*constants(\s|$)/.test(line));
	const hasConstantsEnd = code.some(line => /^\s*constantsEnd(\s|$)/.test(line));

	if (hasModule && hasModuleEnd && !hasFunction && !hasFunctionEnd && !hasConstants && !hasConstantsEnd) {
		return 'module';
	}

	if (hasFunction && hasFunctionEnd && !hasModule && !hasModuleEnd && !hasConstants && !hasConstantsEnd) {
		return 'function';
	}

	if (hasConstants && hasConstantsEnd && !hasModule && !hasModuleEnd && !hasFunction && !hasFunctionEnd) {
		return 'constants';
	}

	return 'unknown';
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

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('getBlockType', () => {
		it('detects module blocks', () => {
			expect(getBlockType(['module foo', 'moduleEnd'])).toBe('module');
		});

		it('detects function blocks', () => {
			expect(getBlockType(['function foo', 'functionEnd'])).toBe('function');
		});

		it('detects constants blocks', () => {
			expect(getBlockType(['constants', 'constantsEnd'])).toBe('constants');
		});

		it('returns unknown for mixed markers', () => {
			expect(getBlockType(['module foo', 'functionEnd', 'moduleEnd'])).toBe('unknown');
		});
	});

	describe('isCompilableBlockType', () => {
		it('returns true for compilable block types', () => {
			expect(isCompilableBlockType('module')).toBe(true);
			expect(isCompilableBlockType('function')).toBe(true);
			expect(isCompilableBlockType('constants')).toBe(true);
			expect(isCompilableBlockType('macro')).toBe(true);
		});

		it('returns false for non-compilable block types', () => {
			expect(isCompilableBlockType('unknown')).toBe(false);
			expect(isCompilableBlockType('vertexShader')).toBe(false);
			expect(isCompilableBlockType(undefined)).toBe(false);
		});
	});
}
