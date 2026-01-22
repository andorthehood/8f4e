import serializeToProject from './serializeToProject';

import { compileConfigForExport } from '../config-compiler/compileConfigForExport';

import type { Project, State } from '~/types';

import { createMockCodeBlock, createMockState } from '~/pureHelpers/testingUtils/testUtils';

/**
 * Serializes current runtime state to runtime-ready Project format.
 * Includes compiled modules and compiled config.
 * This is async because it compiles config blocks on-demand.
 * @param state Current editor state
 * @param encodeToBase64 Function to encode binary data to base64
 * @returns Promise resolving to Project object ready for serialization to JSON
 */
export default async function serializeToRuntimeReadyProject(
	state: State,
	encodeToBase64: (data: Uint8Array) => string
): Promise<Project> {
	// Start with the base serialization
	const project = serializeToProject(state, { includeCompiled: true, encodeToBase64 });

	// Compile config on-demand for runtime-ready export
	const compiledProjectConfig = await compileConfigForExport(state);
	if (Object.keys(compiledProjectConfig).length > 0) {
		project.compiledProjectConfig = compiledProjectConfig;
	}

	return project;
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('serializeToRuntimeReadyProject', () => {
		it('serializes runtime-ready project with compiled config', async () => {
			const configBlock = createMockCodeBlock({
				id: 'config-1',
				blockType: 'config',
				creationIndex: 1,
				code: ['config project', 'memorySizeBytes 65536', 'configEnd'],
			});

			const state = createMockState({
				graphicHelper: {
					codeBlocks: [configBlock],
				},
				compiler: {
					compiledModules: { mod: {} },
					allocatedMemorySize: 2,
				},
				callbacks: {
					compileConfig: async () => ({
						config: { memorySizeBytes: 65536 },
						errors: [],
					}),
				},
			});

			const project = await serializeToRuntimeReadyProject(state, data => `b64:${Array.from(data).join(',')}`);

			expect(project).toMatchSnapshot();
		});

		it('omits compiled config when no config blocks are present', async () => {
			const state = createMockState({
				compiler: {
					compiledModules: {},
					allocatedMemorySize: 0,
				},
			});

			const project = await serializeToRuntimeReadyProject(state, data => `b64:${Array.from(data).join(',')}`);

			expect(project).toMatchSnapshot();
		});
	});
}
