import { describe, expect, it } from 'vitest';
import buildDisplayModel from './buildDisplayModel';

describe('buildDisplayModel', () => {
	it('returns a 1:1 display model for source lines', () => {
		const code = ['module foo', 'push 1', 'moduleEnd'];

		const result = buildDisplayModel(code);

		expect(result.lines).toEqual([
			{ rawRow: 0, text: 'module foo' },
			{ rawRow: 1, text: 'push 1' },
			{ rawRow: 2, text: 'moduleEnd' },
		]);
		expect(result.displayRowToRawRow).toEqual([0, 1, 2]);
		expect(result.rawRowToDisplayRow).toEqual([0, 1, 2]);
		expect(result.isCollapsed).toBe(false);
	});

	it('returns empty mappings for empty code', () => {
		const result = buildDisplayModel([]);

		expect(result.lines).toEqual([]);
		expect(result.displayRowToRawRow).toEqual([]);
		expect(result.rawRowToDisplayRow).toEqual([]);
		expect(result.isCollapsed).toBe(false);
	});

	it('hides everything after @hide while collapsed', () => {
		const code = ['module foo', '; @hide', 'push 1', 'push 2', 'moduleEnd'];

		const result = buildDisplayModel(code, { hideAfterRawRow: 1 });

		expect(result.lines).toEqual([
			{ rawRow: 0, text: 'module foo' },
			{ rawRow: 1, text: '; @hide' },
			{ rawRow: 1, text: '...', isPlaceholder: true },
		]);
		expect(result.displayRowToRawRow).toEqual([0, 1, 1]);
		expect(result.rawRowToDisplayRow).toEqual([0, 2, undefined, undefined, undefined]);
		expect(result.isCollapsed).toBe(true);
	});

	it('does not add a placeholder when @hide is already the last line', () => {
		const code = ['module foo', '; @hide'];

		const result = buildDisplayModel(code, { hideAfterRawRow: 1 });

		expect(result.lines).toEqual([
			{ rawRow: 0, text: 'module foo' },
			{ rawRow: 1, text: '; @hide' },
		]);
		expect(result.displayRowToRawRow).toEqual([0, 1]);
	});

	it('shows the full block while expanded for editing', () => {
		const code = ['module foo', '; @hide', 'push 1', 'moduleEnd'];

		const result = buildDisplayModel(code, {
			hideAfterRawRow: 1,
			isExpandedForEditing: true,
		});

		expect(result.displayRowToRawRow).toEqual([0, 1, 2, 3]);
		expect(result.rawRowToDisplayRow).toEqual([0, 1, 2, 3]);
		expect(result.isCollapsed).toBe(false);
	});
});
