import convertGraphicDataToProjectStructure from './serializeCodeBlocks';

import { createMockCodeBlock, createMockState } from '../testingUtils/testUtils';

import type { Project, State } from '../../types';

/**
 * Serializes current runtime state to Project format for saving to file.
 * Converts pixel coordinates to grid coordinates for persistent storage.
 * Note: This is the synchronous version that doesn't include compiled config.
 * For runtime-ready exports with compiled config, use serializeToRuntimeReadyProject.
 * @param state Current editor state
 * @param options Optional parameters for serialization
 * @param options.includeCompiled If true, includes compiledWasm and memorySnapshot (but not compiledConfig)
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
				x: Math.round(graphicHelper.viewport.x / graphicHelper.viewport.vGrid),
				y: Math.round(graphicHelper.viewport.y / graphicHelper.viewport.hGrid),
			},
		},
		binaryAssets: state.binaryAssets,
		compiledModules: options?.includeCompiled ? compiler.compiledModules : undefined,
		// postProcessEffects are now derived from shader code blocks and not persisted
	};

	// Optionally include compiled WASM and memory snapshot
	if (options?.includeCompiled && options?.encodeToBase64) {
		if (compiler.codeBuffer.length > 0) {
			project.compiledWasm = options.encodeToBase64(compiler.codeBuffer);
		}
		if (compiler.allocatedMemorySize > 0 && compiler.memoryBuffer.byteLength > 0) {
			const memorySnapshotBytes = new Uint8Array(
				compiler.memoryBuffer.buffer,
				compiler.memoryBuffer.byteOffset,
				Math.min(compiler.allocatedMemorySize, compiler.memoryBuffer.byteLength)
			);
			project.memorySnapshot = options.encodeToBase64(memorySnapshotBytes);
		}
	}

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
					viewport: {
						x: 40,
						y: 50,
						vGrid: 10,
						hGrid: 10,
					},
				},
				compiler: {
					compiledModules: { mod: {} },
				},
				binaryAssets: [],
			});

			const project = serializeToProject(state);

			expect(project).toMatchSnapshot();
		});

		it('includes compiled modules, wasm and memory snapshot when requested', () => {
			const state = createMockState({
				graphicHelper: {
					codeBlocks: [],
					viewport: {
						x: 0,
						y: 0,
						vGrid: 10,
						hGrid: 10,
					},
				},
				compiler: {
					compiledModules: { mod: {} },
					codeBuffer: new Uint8Array([1, 2, 3]),
					memoryBuffer: new Int32Array([4, 5, 6, 7]) as unknown as State['compiler']['memoryBuffer'],
					allocatedMemorySize: 2,
				},
				binaryAssets: [],
			});

			const project = serializeToProject(state, {
				includeCompiled: true,
				encodeToBase64: data => `b64:${Array.from(data).join(',')}`,
			});

			expect(project).toMatchSnapshot();
		});
	});
}
