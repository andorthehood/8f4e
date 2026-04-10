import type { CodeBlockType } from '~/types';

import { BLOCK_DELIMITERS, getCloserKeyword, getOpenerKeyword } from '~/features/project-format';

type DetectableBlockType = Exclude<CodeBlockType, 'unknown'>;

/**
 * Detects whether a block of code represents a module, config, function, note, or unknown block by scanning for marker pairs.
 * @param code - Code block represented as an array of lines.
 * @returns The inferred code block type.
 */
export default function getBlockType(code: string[]): CodeBlockType {
	const trimmedLines = code.map(line => line.trim());
	const markerMatches = BLOCK_DELIMITERS.map(({ type, opener, closer }) => ({
		type,
		hasOpener: trimmedLines.some(line => getOpenerKeyword(line) === opener),
		hasCloser: trimmedLines.some(line => getCloserKeyword(line) === closer),
	}));
	const presentTypes = markerMatches.filter(({ hasOpener, hasCloser }) => hasOpener || hasCloser);

	if (presentTypes.length !== 1) {
		return 'unknown';
	}

	const [match] = presentTypes;
	return match.hasOpener && match.hasCloser ? (match.type as DetectableBlockType) : 'unknown';
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

		it('detects macro blocks', () => {
			expect(getBlockType(['defineMacro double', 'push 2', 'mul', 'defineMacroEnd'])).toBe('macro');
		});

		it('detects note blocks', () => {
			expect(getBlockType(['note', '; @pos 10 12', 'some text', 'noteEnd'])).toBe('note');
		});

		it('returns unknown for mixed markers', () => {
			expect(getBlockType(['module foo', 'functionEnd', 'moduleEnd'])).toBe('unknown');
		});

		it('returns unknown for mixed note and module markers', () => {
			expect(getBlockType(['module foo', 'noteEnd'])).toBe('unknown');
		});
	});
}
