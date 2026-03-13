export interface DisplayLine {
	rawRow: number;
	text: string;
}

export interface CodeBlockDisplayModel {
	lines: DisplayLine[];
	displayRowToRawRow: number[];
	rawRowToDisplayRow: Array<number | undefined>;
}

export default function buildDisplayModel(code: string[]): CodeBlockDisplayModel {
	const lines = code.map((text, rawRow) => ({
		rawRow,
		text,
	}));

	const displayRowToRawRow = lines.map(line => line.rawRow);
	const rawRowToDisplayRow = lines.map((_, displayRow) => displayRow);

	return {
		lines,
		displayRowToRawRow,
		rawRowToDisplayRow,
	};
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

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
		});

		it('returns empty mappings for empty code', () => {
			const result = buildDisplayModel([]);

			expect(result.lines).toEqual([]);
			expect(result.displayRowToRawRow).toEqual([]);
			expect(result.rawRowToDisplayRow).toEqual([]);
		});
	});
}
