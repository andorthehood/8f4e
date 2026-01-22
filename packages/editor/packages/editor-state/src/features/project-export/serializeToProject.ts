import convertGraphicDataToProjectStructure from './serializeCodeBlocks';

import type { Project, State } from '~/types';

import { createMockCodeBlock, createMockState } from '~/pureHelpers/testingUtils/testUtils';

/**
 * Serializes current runtime state to Project format for saving to file.
 * Converts pixel coordinates to grid coordinates for persistent storage.
 * Note: This is the synchronous version that doesn't include compiled config.
 * For runtime-ready exports with compiled config, use serializeToRuntimeReadyProject.
 * @param state Current editor state
 * @param options Optional parameters for serialization
 * @param options.includeCompiled If true, includes compiled modules (but not compiledProjectConfig)
 * @returns Project object ready for serialization to JSON
 */
export default function serializeToProject(
	state: State,
	options?: { includeCompiled?: boolean; encodeToBase64?: (data: Uint8Array) => string }
): Project {
	const { graphicHelper, compiler } = state;

	const project: Project = {
		codeBlocks: convertGraphicDataToProjectStructure(graphicHelper.codeBlocks),
		viewport: {
			// Convert pixel coordinates to grid coordinates for persistent storage
			gridCoordinates: {
				x: Math.round(state.viewport.x / state.viewport.vGrid),
				y: Math.round(state.viewport.y / state.viewport.hGrid),
			},
		},
		compiledModules: options?.includeCompiled ? compiler.compiledModules : undefined,
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

		it('includes compiled modules when requested', () => {
			const state = createMockState({
				graphicHelper: {
					codeBlocks: [],
				},
				compiler: {
					compiledModules: { mod: {} },
					allocatedMemorySize: 2,
				},
				binaryAssets: [],
				viewport: {
					x: 0,
					y: 0,
					vGrid: 10,
					hGrid: 10,
				},
			});

			const project = serializeToProject(state, { includeCompiled: true });

			expect(project).toMatchSnapshot();
		});
	});
}
