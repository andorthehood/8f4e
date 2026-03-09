function parseTabDirectiveStops(line: string): number[] | undefined {
	const match = line.match(/^\s*;\s*@tab\s+(.+?)\s*$/);
	if (!match) {
		return undefined;
	}

	const tokens = match[1].trim().split(/\s+/);
	if (tokens.length === 0) {
		return undefined;
	}

	const positions = new Set<number>();
	for (const token of tokens) {
		const value = Number.parseInt(token, 10);
		if (!Number.isInteger(value) || value <= 0 || token !== value.toString()) {
			return undefined;
		}

		positions.add(value);
	}

	return [...positions].sort((a, b) => a - b);
}

export function getTabStopsByLine(code: string[]): number[][] {
	const tabStopsByLine: number[][] = [];
	let activeTabStops: number[] = [];

	for (const line of code) {
		const parsedStops = parseTabDirectiveStops(line);
		if (parsedStops) {
			activeTabStops = parsedStops;
		}

		tabStopsByLine.push(activeTabStops);
	}

	return tabStopsByLine;
}

function getTabAdvance(currentVisualColumn: number, tabStops: number[]): number {
	const nextStop = tabStops.find(stop => stop > currentVisualColumn);
	if (nextStop === undefined) {
		return 1;
	}

	return Math.max(nextStop - currentVisualColumn, 1);
}

export function getVisualColumnForRawIndex(line: string, rawIndex: number, tabStops: number[]): number {
	let visualColumn = 0;
	const boundedRawIndex = Math.max(0, Math.min(rawIndex, line.length));

	for (let i = 0; i < boundedRawIndex; i += 1) {
		visualColumn += line[i] === '\t' ? getTabAdvance(visualColumn, tabStops) : 1;
	}

	return visualColumn;
}

export function getRawIndexForVisualColumn(line: string, visualColumn: number, tabStops: number[]): number {
	const boundedVisualColumn = Math.max(0, visualColumn);
	let currentVisualColumn = 0;

	for (let rawIndex = 0; rawIndex < line.length; rawIndex += 1) {
		if (boundedVisualColumn <= currentVisualColumn) {
			return rawIndex;
		}

		const nextVisualColumn =
			currentVisualColumn + (line[rawIndex] === '\t' ? getTabAdvance(currentVisualColumn, tabStops) : 1);

		if (boundedVisualColumn < nextVisualColumn) {
			return rawIndex + 1;
		}

		currentVisualColumn = nextVisualColumn;
	}

	return line.length;
}

export function getVisualLineWidth(line: string, tabStops: number[]): number {
	return getVisualColumnForRawIndex(line, line.length, tabStops);
}

export function expandLineToCells(line: string, tabStops: number[]): number[] {
	const cells: number[] = [];
	let visualColumn = 0;

	for (let i = 0; i < line.length; i += 1) {
		if (line[i] === '\t') {
			const advance = getTabAdvance(visualColumn, tabStops);
			cells.push(...new Array(advance).fill(32));
			visualColumn += advance;
			continue;
		}

		cells.push(line.charCodeAt(i));
		visualColumn += 1;
	}

	return cells;
}

export function expandLineColorsToCells<T>(
	line: string,
	rawColors: Array<T | undefined>,
	tabStops: number[]
): Array<T | undefined> {
	const expandedColors: Array<T | undefined> = [];
	let visualColumn = 0;

	for (let i = 0; i < line.length; i += 1) {
		if (line[i] === '\t') {
			const advance = getTabAdvance(visualColumn, tabStops);
			expandedColors.push(rawColors[i], ...new Array(Math.max(advance - 1, 0)).fill(undefined));
			visualColumn += advance;
			continue;
		}

		expandedColors.push(rawColors[i]);
		visualColumn += 1;
	}

	return expandedColors;
}

if (import.meta.vitest) {
	const { describe, expect, it } = import.meta.vitest;

	describe('getTabStopsByLine', () => {
		it('parses multiple stops from a single directive', () => {
			expect(getTabStopsByLine(['; @tab 8 16 24', '\tfoo'])).toEqual([
				[8, 16, 24],
				[8, 16, 24],
			]);
		});

		it('uses the most recent valid directive from that line onward', () => {
			expect(getTabStopsByLine(['; @tab 4 8', '\tfoo', '; @tab 12 20', '\tbar'])).toEqual([
				[4, 8],
				[4, 8],
				[12, 20],
				[12, 20],
			]);
		});

		it('ignores malformed directives and keeps the previous active stops', () => {
			expect(getTabStopsByLine(['; @tab 4 8', '\tfoo', '; @tab nope', '\tbar'])).toEqual([
				[4, 8],
				[4, 8],
				[4, 8],
				[4, 8],
			]);
		});

		it('starts with fallback width 1 before any valid directive appears', () => {
			expect(getTabStopsByLine(['\tfoo', '; @tab 6 12', '\tbar'])).toEqual([[], [6, 12], [6, 12]]);
		});
	});

	describe('tab layout helpers', () => {
		it('maps raw indices to visual columns using declared tab stops', () => {
			expect(getVisualColumnForRawIndex('a\tb', 0, [4, 8])).toBe(0);
			expect(getVisualColumnForRawIndex('a\tb', 1, [4, 8])).toBe(1);
			expect(getVisualColumnForRawIndex('a\tb', 2, [4, 8])).toBe(4);
			expect(getVisualColumnForRawIndex('a\tb', 3, [4, 8])).toBe(5);
		});

		it('falls back to width 1 when no later tab stop exists', () => {
			expect(getVisualColumnForRawIndex('\t\t', 2, [4])).toBe(5);
			expect(getVisualLineWidth('\t\t', [4])).toBe(5);
		});

		it('maps visual columns inside a tab span to the raw index after the tab', () => {
			expect(getRawIndexForVisualColumn('a\tb', 0, [4, 8])).toBe(0);
			expect(getRawIndexForVisualColumn('a\tb', 1, [4, 8])).toBe(1);
			expect(getRawIndexForVisualColumn('a\tb', 2, [4, 8])).toBe(2);
			expect(getRawIndexForVisualColumn('a\tb', 3, [4, 8])).toBe(2);
			expect(getRawIndexForVisualColumn('a\tb', 4, [4, 8])).toBe(2);
			expect(getRawIndexForVisualColumn('a\tb', 5, [4, 8])).toBe(3);
		});

		it('expands tabs into space cells for rendering', () => {
			expect(expandLineToCells('a\tb', [4, 8])).toEqual([97, 32, 32, 32, 98]);
		});

		it('expands colors alongside cells', () => {
			expect(expandLineColorsToCells('a\tb', ['A', 'TAB', 'B'], [4, 8])).toEqual([
				'A',
				'TAB',
				undefined,
				undefined,
				'B',
			]);
		});

		it('preserves a color marker anchored on a raw tab in the first expanded tab cell', () => {
			expect(
				expandLineColorsToCells('push\t1', [undefined, undefined, undefined, undefined, 'code', 'number'], [8])
			).toEqual([undefined, undefined, undefined, undefined, 'code', undefined, undefined, undefined, 'number']);
		});
	});
}
