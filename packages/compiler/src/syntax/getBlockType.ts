export type CodeBlockType = 'module' | 'config' | 'function' | 'constants' | 'comment' | 'unknown';

/**
 * Detects whether a block of code represents a module, config, function, comment, or unknown block by scanning for marker pairs.
 * @param code - Code block represented as an array of lines.
 * @returns The inferred code block type.
 */
export function getBlockType(code: string[]): CodeBlockType {
	const hasModule = code.some(line => /^\s*module(\s|$)/.test(line));
	const hasModuleEnd = code.some(line => /^\s*moduleEnd(\s|$)/.test(line));
	const hasConfig = code.some(line => /^\s*config(\s|$)/.test(line));
	const hasConfigEnd = code.some(line => /^\s*configEnd(\s|$)/.test(line));
	const hasFunction = code.some(line => /^\s*function(\s|$)/.test(line));
	const hasFunctionEnd = code.some(line => /^\s*functionEnd(\s|$)/.test(line));
	const hasConstants = code.some(line => /^\s*constants(\s|$)/.test(line));
	const hasConstantsEnd = code.some(line => /^\s*constantsEnd(\s|$)/.test(line));
	const hasComment = code.some(line => /^\s*comment(\s|$)/.test(line));
	const hasCommentEnd = code.some(line => /^\s*commentEnd(\s|$)/.test(line));

	if (
		hasModule &&
		hasModuleEnd &&
		!hasConfig &&
		!hasConfigEnd &&
		!hasFunction &&
		!hasFunctionEnd &&
		!hasConstants &&
		!hasConstantsEnd &&
		!hasComment &&
		!hasCommentEnd
	) {
		return 'module';
	}

	if (
		hasConfig &&
		hasConfigEnd &&
		!hasModule &&
		!hasModuleEnd &&
		!hasFunction &&
		!hasFunctionEnd &&
		!hasConstants &&
		!hasConstantsEnd &&
		!hasComment &&
		!hasCommentEnd
	) {
		return 'config';
	}

	if (
		hasFunction &&
		hasFunctionEnd &&
		!hasModule &&
		!hasModuleEnd &&
		!hasConfig &&
		!hasConfigEnd &&
		!hasConstants &&
		!hasConstantsEnd &&
		!hasComment &&
		!hasCommentEnd
	) {
		return 'function';
	}

	if (
		hasConstants &&
		hasConstantsEnd &&
		!hasModule &&
		!hasModuleEnd &&
		!hasConfig &&
		!hasConfigEnd &&
		!hasFunction &&
		!hasFunctionEnd &&
		!hasComment &&
		!hasCommentEnd
	) {
		return 'constants';
	}

	if (
		hasComment &&
		hasCommentEnd &&
		!hasModule &&
		!hasModuleEnd &&
		!hasConfig &&
		!hasConfigEnd &&
		!hasFunction &&
		!hasFunctionEnd &&
		!hasConstants &&
		!hasConstantsEnd
	) {
		return 'comment';
	}

	return 'unknown';
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('getBlockType', () => {
		it('detects module blocks', () => {
			expect(getBlockType(['module foo', 'moduleEnd'])).toBe('module');
		});

		it('detects config blocks', () => {
			expect(getBlockType(['config', 'configEnd'])).toBe('config');
		});

		it('detects function blocks', () => {
			expect(getBlockType(['function foo', 'functionEnd'])).toBe('function');
		});

		it('detects constants blocks', () => {
			expect(getBlockType(['constants', 'constantsEnd'])).toBe('constants');
		});

		it('detects comment blocks', () => {
			expect(getBlockType(['comment', 'This is a comment', 'commentEnd'])).toBe('comment');
		});

		it('returns unknown for mixed markers', () => {
			expect(getBlockType(['module foo', 'functionEnd', 'moduleEnd'])).toBe('unknown');
		});
	});
}
