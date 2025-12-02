import type { CodeBlockType } from '../../types';

/**
 * Detects whether a block of code represents a module, config, or unknown block by scanning for marker pairs.
 * @param code - Code block represented as an array of lines.
 * @returns The inferred code block type.
 */
export default function getBlockType(code: string[]): CodeBlockType {
	const hasModule = code.some(line => /^\s*module(\s|$)/.test(line));
	const hasModuleEnd = code.some(line => /^\s*moduleEnd(\s|$)/.test(line));
	const hasConfig = code.some(line => /^\s*config(\s|$)/.test(line));
	const hasConfigEnd = code.some(line => /^\s*configEnd(\s|$)/.test(line));

	if (hasModule && hasModuleEnd && !hasConfig && !hasConfigEnd) {
		return 'module';
	}

	if (hasConfig && hasConfigEnd && !hasModule && !hasModuleEnd) {
		return 'config';
	}

	return 'unknown';
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('getBlockType', () => {
		describe('module detection', () => {
			it('detects a complete module block', () => {
				expect(getBlockType(['module test', 'int x', 'moduleEnd'])).toBe('module');
			});

			it('detects module with leading whitespace', () => {
				expect(getBlockType(['  module test', '  int x', '  moduleEnd'])).toBe('module');
			});

			it('detects module with content after keyword', () => {
				expect(getBlockType(['module test someExtraInfo', 'int x', 'moduleEnd'])).toBe('module');
			});

			it('does not detect module if moduleEnd is missing', () => {
				expect(getBlockType(['module test', 'int x'])).toBe('unknown');
			});

			it('does not detect module if module is missing', () => {
				expect(getBlockType(['int x', 'moduleEnd'])).toBe('unknown');
			});
		});

		describe('config detection', () => {
			it('detects a complete config block', () => {
				expect(getBlockType(['config', 'push 42', 'set', 'configEnd'])).toBe('config');
			});

			it('detects config with leading whitespace', () => {
				expect(getBlockType(['  config', '  push 42', '  configEnd'])).toBe('config');
			});

			it('does not detect config if configEnd is missing', () => {
				expect(getBlockType(['config', 'push 42'])).toBe('unknown');
			});

			it('does not detect config if config is missing', () => {
				expect(getBlockType(['push 42', 'configEnd'])).toBe('unknown');
			});
		});

		describe('unknown states', () => {
			it('returns unknown for empty code', () => {
				expect(getBlockType([])).toBe('unknown');
			});

			it('returns unknown when no markers are present', () => {
				expect(getBlockType(['int x', 'int y'])).toBe('unknown');
			});

			it('returns unknown when module and config markers are mixed', () => {
				expect(getBlockType(['module test', 'config', 'moduleEnd', 'configEnd'])).toBe('unknown');
			});

			it('returns unknown when config block contains module markers', () => {
				expect(getBlockType(['config', 'module test', 'moduleEnd', 'configEnd'])).toBe('unknown');
			});

			it('returns unknown when module block contains config markers', () => {
				expect(getBlockType(['module test', 'config', 'configEnd', 'moduleEnd'])).toBe('unknown');
			});
		});

		describe('edge cases', () => {
			it('does not match module within another word', () => {
				expect(getBlockType(['somemodule test', 'moduleEnd'])).toBe('unknown');
			});

			it('does not match config within another word', () => {
				expect(getBlockType(['someconfig', 'configEnd'])).toBe('unknown');
			});

			it('matches module keyword at end of line', () => {
				expect(getBlockType(['module', 'moduleEnd'])).toBe('module');
			});

			it('matches config keyword at end of line', () => {
				expect(getBlockType(['config', 'configEnd'])).toBe('config');
			});
		});
	});
}
