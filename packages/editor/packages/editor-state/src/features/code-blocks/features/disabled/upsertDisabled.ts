/**
 * Inserts or removes @disabled directive from code block lines.
 *
 * Rules:
 * - If disabled is true, ensures exactly one @disabled directive exists
 * - If disabled is false, removes all @disabled directives
 * - When inserting, places @disabled at the beginning (after first line if it's a block declaration)
 * - Idempotent: calling with same disabled value produces same result
 *
 * @param code - Array of code lines
 * @param disabled - Whether the block should be disabled
 * @returns New code array with @disabled directive inserted or removed
 *
 * @example
 * ```typescript
 * const code = ['module test', 'moduleEnd'];
 * const disabled = upsertDisabled(code, true);
 * // Result: ['module test', '; @disabled', 'moduleEnd']
 * const enabled = upsertDisabled(disabled, false);
 * // Result: ['module test', 'moduleEnd']
 * ```
 */
export default function upsertDisabled(code: string[], disabled: boolean): string[] {
	// Remove all existing @disabled directives
	const withoutDisabled = code.filter(line => {
		const commentMatch = line.match(/^\s*;\s*@(\w+)/);
		return !(commentMatch && commentMatch[1] === 'disabled');
	});

	// If disabled is false, just return the code without @disabled directives
	if (!disabled) {
		return withoutDisabled;
	}

	// Create canonical @disabled directive
	const disabledDirective = '; @disabled';

	// Insert after first line if it exists, otherwise at the beginning
	if (withoutDisabled.length === 0) {
		return [disabledDirective];
	}

	// Insert @disabled as second line (after block declaration)
	return [withoutDisabled[0], disabledDirective, ...withoutDisabled.slice(1)];
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('upsertDisabled', () => {
		it('adds @disabled directive when disabled is true', () => {
			const code = ['module test', 'moduleEnd'];
			const result = upsertDisabled(code, true);
			expect(result).toEqual(['module test', '; @disabled', 'moduleEnd']);
		});

		it('removes @disabled directive when disabled is false', () => {
			const code = ['module test', '; @disabled', 'moduleEnd'];
			const result = upsertDisabled(code, false);
			expect(result).toEqual(['module test', 'moduleEnd']);
		});

		it('is idempotent when disabled is true', () => {
			const code = ['module test', 'moduleEnd'];
			const result1 = upsertDisabled(code, true);
			const result2 = upsertDisabled(result1, true);
			expect(result1).toEqual(result2);
			expect(result1).toEqual(['module test', '; @disabled', 'moduleEnd']);
		});

		it('is idempotent when disabled is false', () => {
			const code = ['module test', 'moduleEnd'];
			const result1 = upsertDisabled(code, false);
			const result2 = upsertDisabled(result1, false);
			expect(result1).toEqual(result2);
			expect(result1).toEqual(['module test', 'moduleEnd']);
		});

		it('removes multiple @disabled directives when disabled is false', () => {
			const code = ['module test', '; @disabled', '; @disabled', 'moduleEnd'];
			const result = upsertDisabled(code, false);
			expect(result).toEqual(['module test', 'moduleEnd']);
		});

		it('removes multiple @disabled directives and adds one when disabled is true', () => {
			const code = ['module test', '; @disabled', '; @disabled', 'moduleEnd'];
			const result = upsertDisabled(code, true);
			expect(result).toEqual(['module test', '; @disabled', 'moduleEnd']);
		});

		it('preserves other directives when adding @disabled', () => {
			const code = ['module test', '; @group myGroup', '; @pos 10 20', '; @favorite', 'moduleEnd'];
			const result = upsertDisabled(code, true);
			expect(result).toEqual([
				'module test',
				'; @disabled',
				'; @group myGroup',
				'; @pos 10 20',
				'; @favorite',
				'moduleEnd',
			]);
		});

		it('preserves other directives when removing @disabled', () => {
			const code = ['module test', '; @disabled', '; @group myGroup', '; @pos 10 20', 'moduleEnd'];
			const result = upsertDisabled(code, false);
			expect(result).toEqual(['module test', '; @group myGroup', '; @pos 10 20', 'moduleEnd']);
		});

		it('handles empty code array when disabled is true', () => {
			const code: string[] = [];
			const result = upsertDisabled(code, true);
			expect(result).toEqual(['; @disabled']);
		});

		it('handles empty code array when disabled is false', () => {
			const code: string[] = [];
			const result = upsertDisabled(code, false);
			expect(result).toEqual([]);
		});

		it('handles single-line code when disabled is true', () => {
			const code = ['module test'];
			const result = upsertDisabled(code, true);
			expect(result).toEqual(['module test', '; @disabled']);
		});

		it('handles single-line code when disabled is false', () => {
			const code = ['module test'];
			const result = upsertDisabled(code, false);
			expect(result).toEqual(['module test']);
		});

		it('replaces @disabled at different position with canonical position when disabled is true', () => {
			const code = ['module test', 'output out 1', '; @disabled', 'moduleEnd'];
			const result = upsertDisabled(code, true);
			expect(result).toEqual(['module test', '; @disabled', 'output out 1', 'moduleEnd']);
		});

		it('handles plain comments that mention disabled but are not directives', () => {
			const code = ['module test', '; this is disabled by default', 'moduleEnd'];
			const result = upsertDisabled(code, true);
			expect(result).toEqual(['module test', '; @disabled', '; this is disabled by default', 'moduleEnd']);
		});

		it('preserves exact order of other directives when adding @disabled', () => {
			const code = ['module test', '; @group myGroup', '; @favorite', '; @pos 10 20', 'output out 1', 'moduleEnd'];
			const result = upsertDisabled(code, true);
			expect(result).toEqual([
				'module test',
				'; @disabled',
				'; @group myGroup',
				'; @favorite',
				'; @pos 10 20',
				'output out 1',
				'moduleEnd',
			]);
		});
	});
}
