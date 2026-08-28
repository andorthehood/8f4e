import { describe, expect, it } from 'vitest';
import { createMockCodeBlock } from '~/pureHelpers/testingUtils/testUtils';
import replaceCodeBlocksInPlace from './replaceCodeBlocksInPlace';

describe('replaceCodeBlocksInPlace', () => {
	it('preserves the project slice identity while replacing its contents', () => {
		const originalBlock = createMockCodeBlock({ name: 'original' });
		const replacementBlock = createMockCodeBlock({ name: 'replacement' });
		const projectSlice = [originalBlock];
		const renderedSlice = projectSlice;

		replaceCodeBlocksInPlace(renderedSlice, [replacementBlock]);

		expect(renderedSlice).toBe(projectSlice);
		expect(projectSlice).toEqual([replacementBlock]);
	});
});
