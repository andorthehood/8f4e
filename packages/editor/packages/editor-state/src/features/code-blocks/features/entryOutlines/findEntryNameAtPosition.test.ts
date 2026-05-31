import type { CodeBlockEntryOutline } from '@8f4e/editor-state-types';
import { describe, expect, it } from 'vitest';
import findEntryNameAtPosition from './findEntryNameAtPosition';

describe('findEntryNameAtPosition', () => {
	it('returns the first entry outline containing the position', () => {
		const entryOutlines: CodeBlockEntryOutline[] = [
			{
				entryName: 'first',
				topLeft: { x: 0, y: 0 },
				topRight: { x: 100, y: 0 },
				bottomRight: { x: 100, y: 100 },
				bottomLeft: { x: 0, y: 100 },
			},
			{
				entryName: 'second',
				topLeft: { x: 0, y: 0 },
				topRight: { x: 100, y: 0 },
				bottomRight: { x: 100, y: 100 },
				bottomLeft: { x: 0, y: 100 },
			},
		];

		expect(findEntryNameAtPosition(entryOutlines, 50, 50)).toBe('first');
	});

	it('returns undefined when no entry outline contains the position', () => {
		const entryOutlines: CodeBlockEntryOutline[] = [
			{
				entryName: 'main',
				topLeft: { x: 0, y: 0 },
				topRight: { x: 100, y: 0 },
				bottomRight: { x: 100, y: 100 },
				bottomLeft: { x: 0, y: 100 },
			},
		];

		expect(findEntryNameAtPosition(entryOutlines, 120, 50)).toBeUndefined();
	});
});
