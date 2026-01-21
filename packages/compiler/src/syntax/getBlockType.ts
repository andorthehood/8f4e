export type CodeBlockType = 'module' | 'projectConfig' | 'function' | 'constants' | 'unknown';

/**
 * Detects whether a block of code represents a module, projectConfig, function, or unknown block by scanning for marker pairs.
 * @param code - Code block represented as an array of lines.
 * @returns The inferred code block type.
 */
export function getBlockType(code: string[]): CodeBlockType {
	const hasModule = code.some(line => /^\s*module(\s|$)/.test(line));
	const hasModuleEnd = code.some(line => /^\s*moduleEnd(\s|$)/.test(line));
	const hasProjectConfig = code.some(line => /^\s*projectConfig(\s|$)/.test(line));
	const hasProjectConfigEnd = code.some(line => /^\s*projectConfigEnd(\s|$)/.test(line));
	const hasFunction = code.some(line => /^\s*function(\s|$)/.test(line));
	const hasFunctionEnd = code.some(line => /^\s*functionEnd(\s|$)/.test(line));
	const hasConstants = code.some(line => /^\s*constants(\s|$)/.test(line));
	const hasConstantsEnd = code.some(line => /^\s*constantsEnd(\s|$)/.test(line));

	if (
		hasModule &&
		hasModuleEnd &&
		!hasProjectConfig &&
		!hasProjectConfigEnd &&
		!hasFunction &&
		!hasFunctionEnd &&
		!hasConstants &&
		!hasConstantsEnd
	) {
		return 'module';
	}

	if (
		hasProjectConfig &&
		hasProjectConfigEnd &&
		!hasModule &&
		!hasModuleEnd &&
		!hasFunction &&
		!hasFunctionEnd &&
		!hasConstants &&
		!hasConstantsEnd
	) {
		return 'projectConfig';
	}

	if (
		hasFunction &&
		hasFunctionEnd &&
		!hasModule &&
		!hasModuleEnd &&
		!hasProjectConfig &&
		!hasProjectConfigEnd &&
		!hasConstants &&
		!hasConstantsEnd
	) {
		return 'function';
	}

	if (
		hasConstants &&
		hasConstantsEnd &&
		!hasModule &&
		!hasModuleEnd &&
		!hasProjectConfig &&
		!hasProjectConfigEnd &&
		!hasFunction &&
		!hasFunctionEnd
	) {
		return 'constants';
	}

	return 'unknown';
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('getBlockType', () => {
		it('detects module blocks', () => {
			expect(getBlockType(['module foo', 'moduleEnd'])).toBe('module');
		});

		it('detects projectConfig blocks', () => {
			expect(getBlockType(['projectConfig', 'projectConfigEnd'])).toBe('projectConfig');
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
}
