import { describe, expect, it } from 'vitest';
import { planArrayDeclarationLayout, planScalarDeclarationLayout } from './declarations';

describe('memory declaration layout planner', () => {
	const float64Starts = [
		{ startingByteAddress: 4, localWordOffset: 0, byteAddress: 8, padding: 1 },
		{ startingByteAddress: 8, localWordOffset: 0, byteAddress: 8, padding: 0 },
		{ startingByteAddress: 4, localWordOffset: 1, byteAddress: 8, padding: 0 },
		{ startingByteAddress: 8, localWordOffset: 1, byteAddress: 16, padding: 1 },
	];

	it.each(float64Starts)(
		'keeps scalar float64 bounds inside its storage at base $startingByteAddress and offset $localWordOffset',
		({ startingByteAddress, localWordOffset, byteAddress, padding }) => {
			const result = planScalarDeclarationLayout({
				id: 'value',
				lineNumber: 1,
				instruction: 'float64',
				startingByteAddress,
				localWordOffset,
			});
			expect(result.declaration).toMatchObject({
				byteAddress,
				wordAlignedSize: padding + 2,
				wordAlignedByteLength: 8,
				elementByteLength: 8,
				endByteAddress: byteAddress + 4,
				endAddressSafeByteLength: 4,
			});
			expect(result.nextLocalWordOffset).toBe(localWordOffset + padding + 2);
			const following = planScalarDeclarationLayout({
				id: 'next',
				lineNumber: 2,
				instruction: 'int',
				startingByteAddress,
				localWordOffset: result.nextLocalWordOffset,
			});
			expect(following.declaration.byteAddress).toBe(byteAddress + 8);
		}
	);

	it.each(float64Starts.flatMap(start => [0, 1, 2].map(numberOfElements => ({ ...start, numberOfElements }))))(
		'keeps $numberOfElements-element float64 array bounds inside its storage at base $startingByteAddress and offset $localWordOffset',
		({ startingByteAddress, localWordOffset, byteAddress, padding, numberOfElements }) => {
			const result = planArrayDeclarationLayout({
				id: 'values',
				lineNumber: 1,
				instruction: 'float64[]',
				startingByteAddress,
				localWordOffset,
				numberOfElements,
			});
			expect(result.declaration).toMatchObject({
				byteAddress,
				wordAlignedSize: padding + numberOfElements * 2,
				wordAlignedByteLength: numberOfElements * 8,
				elementByteLength: numberOfElements * 8,
				endByteAddress: numberOfElements === 0 ? byteAddress : byteAddress + numberOfElements * 8 - 4,
				endAddressSafeByteLength: numberOfElements === 0 ? 0 : 4,
			});
			expect(result.nextLocalWordOffset).toBe(localWordOffset + padding + numberOfElements * 2);
			const following = planScalarDeclarationLayout({
				id: 'next',
				lineNumber: 2,
				instruction: 'int',
				startingByteAddress,
				localWordOffset: result.nextLocalWordOffset,
			});
			expect(following.declaration.byteAddress).toBe(byteAddress + numberOfElements * 8);
		}
	);

	it('plans scalar declaration addresses on the 4-byte grid', () => {
		const result = planScalarDeclarationLayout({
			id: 'counter',
			lineNumber: 1,
			instruction: 'int',
			startingByteAddress: 4,
			localWordOffset: 0,
		});

		expect(result).toEqual({
			declaration: {
				numberOfElements: 1,
				elementWordSize: 4,
				wordAlignedAddress: 1,
				wordAlignedSize: 1,
				wordAlignedByteLength: 4,
				byteAddress: 4,
				elementByteLength: 4,
				endByteAddress: 4,
				endAddressSafeByteLength: 4,
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
		});

		expect(result.declaration).toMatchObject({
			numberOfElements: 5,
			elementWordSize: 1,
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
		});

		expect(result.declaration.wordAlignedAddress).toBe(2);
		expect(result.declaration.byteAddress).toBe(8);
		expect(result.declaration.wordAlignedSize).toBe(5);
		expect(result.nextLocalWordOffset).toBe(5);
	});
});
