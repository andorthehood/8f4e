import { describe, expect, it } from 'vitest';
import { planArrayDeclarationLayout, planScalarDeclarationLayout } from './declarations';

describe('memory declaration layout planner', () => {
	it('plans scalar declaration addresses on the 4-byte grid', () => {
		const result = planScalarDeclarationLayout({
			id: 'counter',
			lineNumber: 1,
			instruction: 'int',
			startingByteAddress: 4,
			localWordOffset: 0,
			region: { memoryIndex: 0 },
		});

		expect(result).toEqual({
			declaration: {
				numberOfElements: 1,
				elementWordSize: 4,
				memoryIndex: 0,
				wordAlignedAddress: 1,
				wordAlignedSize: 1,
				byteAddress: 4,
				id: 'counter',
				lineNumber: 1,
				type: 'int',
				pointerDepth: 0,
				isInteger: true,
				isUnsigned: false,
			},
			nextLocalWordOffset: 1,
		});
	});

	it('adds alignment padding before scalar float64 declarations at odd word offsets', () => {
		const result = planScalarDeclarationLayout({
			id: 'phase',
			lineNumber: 2,
			instruction: 'float64',
			startingByteAddress: 4,
			localWordOffset: 0,
			region: { memoryIndex: 0 },
		});

		expect(result.declaration.wordAlignedAddress).toBe(2);
		expect(result.declaration.byteAddress).toBe(8);
		expect(result.declaration.wordAlignedSize).toBe(3);
		expect(result.nextLocalWordOffset).toBe(3);
	});

	it('plans narrow arrays using byte width rounded to the word grid', () => {
		const result = planArrayDeclarationLayout({
			id: 'bytes',
			lineNumber: 3,
			instruction: 'int8[]',
			numberOfElements: 5,
			startingByteAddress: 4,
			localWordOffset: 0,
			region: { memoryIndex: 1, memoryRegionName: 'audio' },
		});

		expect(result.declaration).toMatchObject({
			numberOfElements: 5,
			elementWordSize: 1,
			memoryIndex: 1,
			memoryRegionName: 'audio',
			wordAlignedAddress: 1,
			wordAlignedSize: 2,
			byteAddress: 4,
			id: 'bytes',
			lineNumber: 3,
			type: 'int8',
			pointerDepth: 0,
			isInteger: true,
			isUnsigned: false,
		});
		expect(result.nextLocalWordOffset).toBe(2);
	});

	it('aligns float64 arrays to 8-byte boundaries', () => {
		const result = planArrayDeclarationLayout({
			id: 'doubles',
			lineNumber: 4,
			instruction: 'float64[]',
			numberOfElements: 2,
			startingByteAddress: 4,
			localWordOffset: 0,
			region: { memoryIndex: 0 },
		});

		expect(result.declaration.wordAlignedAddress).toBe(2);
		expect(result.declaration.byteAddress).toBe(8);
		expect(result.declaration.wordAlignedSize).toBe(5);
		expect(result.nextLocalWordOffset).toBe(5);
	});
});
