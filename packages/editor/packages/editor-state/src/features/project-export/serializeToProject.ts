import convertGraphicDataToProjectStructure from './serializeCodeBlocks';

import type { Project, State } from '~/types';

import { createMockCodeBlock, createMockState } from '~/pureHelpers/testingUtils/testUtils';

/**
 * Serializes current runtime state to Project format for saving to file.
 * @param state Current editor state
 * @returns Project object ready for `.8f4e` export and session persistence
 */
export default function serializeToProject(state: State): Project {
	const { graphicHelper } = state;

	const project: Project = {
		codeBlocks: convertGraphicDataToProjectStructure(graphicHelper.codeBlocks),
		// postProcessEffects are now derived from shader code blocks and not persisted
	};

	return project;
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('serializeToProject', () => {
		it('serializes basic project state without compiled data', () => {
			const state = createMockState({
				graphicHelper: {
					codeBlocks: [
						createMockCodeBlock({
							id: 'block-1',
							code: ['10 example'],
							x: 20,
							y: 30,
						}),
					],
				},
				compiler: {
					compiledModules: { mod: {} },
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
	});
}
