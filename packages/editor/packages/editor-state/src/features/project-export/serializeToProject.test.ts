import { describe, expect, it } from 'vitest';
import { createMockCodeBlock, createMockState } from '~/pureHelpers/testingUtils/testUtils';
import serializeToProject from './serializeToProject';

describe('serializeToProject', () => {
	it('serializes basic project state without compiled data', () => {
		const state = createMockState({
			codeBlockRendering: {
				codeBlocks: [
					createMockCodeBlock({
						name: 'block-1',
						code: ['10 example'],
						x: 20,
						y: 30,
					}),
				],
			},
			binaryAssets: [],
			viewport: {
				x: 40,
				y: 50,
				vGrid: 10,
				hGrid: 10,
			},
		});

		const project = serializeToProject(state);

		expect(project).toMatchSnapshot();
	});

	it('derives serialized project data from current code blocks', () => {
		const state = createMockState({
			codeBlockRendering: {
				codeBlocks: [
					createMockCodeBlock({
						name: 'includes',
						code: ['includes', 'include std/current', 'includesEnd'],
						x: 0,
						y: 0,
					}),
				],
			},
		});

		expect(serializeToProject(state)).toEqual({
			codeBlocks: [
				expect.objectContaining({
					code: ['includes', 'include std/current', 'includesEnd'],
				}),
			],
		});
	});
});
