import type { CodeBlockEntryOutline, CodeBlockGraphicData } from '@8f4e/editor-state-types';

type EntryBounds = {
	entryName: string;
	minX: number;
	minY: number;
	maxX: number;
	maxY: number;
	count: number;
};

const DEFAULT_ENTRY_NAME = 'main';

function getEntryName(codeBlock: CodeBlockGraphicData): string {
	return codeBlock.executionEntryName ?? DEFAULT_ENTRY_NAME;
}

function createBounds(entryName: string): EntryBounds {
	return {
		entryName,
		minX: Number.POSITIVE_INFINITY,
		minY: Number.POSITIVE_INFINITY,
		maxX: Number.NEGATIVE_INFINITY,
		maxY: Number.NEGATIVE_INFINITY,
		count: 0,
	};
}

function updateBounds(bounds: EntryBounds, codeBlock: CodeBlockGraphicData): void {
	bounds.minX = Math.min(bounds.minX, codeBlock.x);
	bounds.minY = Math.min(bounds.minY, codeBlock.y);
	bounds.maxX = Math.max(bounds.maxX, codeBlock.x + codeBlock.width);
	bounds.maxY = Math.max(bounds.maxY, codeBlock.y + codeBlock.height);
	bounds.count++;
}

function createOutline(bounds: EntryBounds, paddingX: number, paddingY: number): CodeBlockEntryOutline {
	const left = bounds.minX - paddingX;
	const top = bounds.minY - paddingY;
	const right = bounds.maxX + paddingX;
	const bottom = bounds.maxY + paddingY;

	return {
		entryName: bounds.entryName,
		topLeft: { x: left, y: top },
		topRight: { x: right, y: top },
		bottomRight: { x: right, y: bottom },
		bottomLeft: { x: left, y: bottom },
	};
}

export default function deriveEntryOutlines(
	codeBlocks: CodeBlockGraphicData[],
	paddingX = 0,
	paddingY = 0
): CodeBlockEntryOutline[] {
	const boundsByEntry = new Map<string, EntryBounds>();

	for (const codeBlock of codeBlocks) {
		if (codeBlock.blockType !== 'module') {
			continue;
		}

		const entryName = getEntryName(codeBlock);
		const bounds = boundsByEntry.get(entryName) ?? createBounds(entryName);
		updateBounds(bounds, codeBlock);
		boundsByEntry.set(entryName, bounds);
	}

	return [...boundsByEntry.values()]
		.filter(bounds => bounds.count > 1)
		.map(bounds => createOutline(bounds, paddingX, paddingY));
}

if (import.meta.vitest) {
	const { describe, expect, it } = import.meta.vitest;

	describe('deriveEntryOutlines', () => {
		it('derives corners around module blocks that share an entry', () => {
			const outlines = deriveEntryOutlines([
				{
					blockType: 'module',
					executionEntryName: 'main',
					x: 16,
					y: 32,
					width: 80,
					height: 40,
				} as CodeBlockGraphicData,
				{
					blockType: 'module',
					executionEntryName: 'main',
					x: 160,
					y: 96,
					width: 96,
					height: 48,
				} as CodeBlockGraphicData,
				{
					blockType: 'module',
					executionEntryName: 'test',
					x: 0,
					y: 0,
					width: 100,
					height: 100,
				} as CodeBlockGraphicData,
				{
					blockType: 'function',
					x: -100,
					y: -100,
					width: 400,
					height: 400,
				} as CodeBlockGraphicData,
			]);

			expect(outlines).toEqual([
				{
					entryName: 'main',
					topLeft: { x: 16, y: 32 },
					topRight: { x: 256, y: 32 },
					bottomRight: { x: 256, y: 144 },
					bottomLeft: { x: 16, y: 144 },
				},
			]);
		});

		it('applies padding to the derived corners', () => {
			const outlines = deriveEntryOutlines(
				[
					{ blockType: 'module', x: 10, y: 20, width: 30, height: 40 } as CodeBlockGraphicData,
					{ blockType: 'module', x: 100, y: 120, width: 30, height: 40 } as CodeBlockGraphicData,
				],
				8,
				16
			);

			expect(outlines[0]).toEqual({
				entryName: 'main',
				topLeft: { x: 2, y: 4 },
				topRight: { x: 138, y: 4 },
				bottomRight: { x: 138, y: 176 },
				bottomLeft: { x: 2, y: 176 },
			});
		});

		it('groups modules without an explicit entry as main', () => {
			const outlines = deriveEntryOutlines([
				{ blockType: 'module', x: 0, y: 0, width: 10, height: 10 } as CodeBlockGraphicData,
				{ blockType: 'module', x: 20, y: 20, width: 10, height: 10 } as CodeBlockGraphicData,
			]);

			expect(outlines[0].entryName).toBe('main');
		});
	});
}
