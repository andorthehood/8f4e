import type { BlockLineMapping } from './combineConfigBlocks';

/**
 * Maps an error line number from the combined source to a specific block and local line number.
 * Returns null if the line cannot be mapped to a block.
 */
export function mapErrorLineToBlock(
	errorLine: number,
	lineMappings: BlockLineMapping[]
): { blockId: number; localLine: number } | null {
	for (const mapping of lineMappings) {
		if (errorLine >= mapping.startLine && errorLine <= mapping.endLine) {
			return {
				blockId: mapping.blockId,
				localLine: errorLine - mapping.startLine + 1, // Convert to 1-based local line
			};
		}
	}
	// Schema-wide errors at line 1 or unmappable lines: map to first block
	if (lineMappings.length > 0) {
		return {
			blockId: lineMappings[0].blockId,
			localLine: 1,
		};
	}
	return null;
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('mapErrorLineToBlock', () => {
		it('should map error to correct block and local line', () => {
			const lineMappings = [
				{ blockId: 0, startLine: 1, endLine: 2 },
				{ blockId: 1, startLine: 4, endLine: 5 },
			];

			// Error on line 1 (first line of block 0)
			let mapped = mapErrorLineToBlock(1, lineMappings);
			expect(mapped).toEqual({ blockId: 0, localLine: 1 });

			// Error on line 2 (second line of block 0)
			mapped = mapErrorLineToBlock(2, lineMappings);
			expect(mapped).toEqual({ blockId: 0, localLine: 2 });

			// Error on line 4 (first line of block 1)
			mapped = mapErrorLineToBlock(4, lineMappings);
			expect(mapped).toEqual({ blockId: 1, localLine: 1 });

			// Error on line 5 (second line of block 1)
			mapped = mapErrorLineToBlock(5, lineMappings);
			expect(mapped).toEqual({ blockId: 1, localLine: 2 });
		});

		it('should map unmappable lines to first block, line 1', () => {
			const lineMappings = [
				{ blockId: 0, startLine: 1, endLine: 2 },
				{ blockId: 1, startLine: 4, endLine: 5 },
			];

			// Error on line 3 (blank line between blocks)
			const mapped = mapErrorLineToBlock(3, lineMappings);
			expect(mapped).toEqual({ blockId: 0, localLine: 1 });
		});

		it('should return null for empty mappings', () => {
			const mapped = mapErrorLineToBlock(1, []);
			expect(mapped).toBeNull();
		});

		it('should handle single block mapping', () => {
			const lineMappings = [{ blockId: 5, startLine: 1, endLine: 3 }];

			const mapped = mapErrorLineToBlock(2, lineMappings);
			expect(mapped).toEqual({ blockId: 5, localLine: 2 });
		});

		it('should map out-of-range line to first block', () => {
			const lineMappings = [
				{ blockId: 0, startLine: 1, endLine: 2 },
				{ blockId: 1, startLine: 4, endLine: 5 },
			];

			// Error on line 10 (beyond all blocks)
			const mapped = mapErrorLineToBlock(10, lineMappings);
			expect(mapped).toEqual({ blockId: 0, localLine: 1 });
		});
	});
}
