import { compileConfigForExport } from '../effects/config';

import type { CodeBlock, CodeBlockGraphicData, Project, State } from '../types';

/**
 * Converts graphic data code blocks to simplified project structure for serialization.
 * Uses gridCoordinates for persistent storage, computed from pixel positions.
 * @param codeBlocks Array of code blocks with full graphic data
 * @param vGrid Vertical grid size for converting pixels to grid coordinates
 * @param hGrid Horizontal grid size for converting pixels to grid coordinates
 * @returns Array of simplified code blocks suitable for file format with gridCoordinates
 */
export function convertGraphicDataToProjectStructure(
	codeBlocks: CodeBlockGraphicData[],
	vGrid: number,
	hGrid: number
): CodeBlock[] {
	return codeBlocks
		.sort((codeBlockA, codeBlockB) => {
			if (codeBlockA.id > codeBlockB.id) {
				return 1;
			} else if (codeBlockA.id < codeBlockB.id) {
				return -1;
			}
			return 0;
		})
		.map(codeBlock => ({
			code: codeBlock.code,
			gridCoordinates: {
				x: Math.round(codeBlock.x / vGrid),
				y: Math.round(codeBlock.y / hGrid),
			},
		}));
}

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
export function serializeToProject(
	state: State,
	options?: { includeCompiled?: boolean; encodeToBase64?: (data: Uint8Array) => string }
): Project {
	const { graphicHelper, compiler } = state;

	const project: Project = {
		codeBlocks: convertGraphicDataToProjectStructure(
			Array.from(graphicHelper.codeBlocks),
			graphicHelper.viewport.vGrid,
			graphicHelper.viewport.hGrid
		),
		viewport: {
			// Convert pixel coordinates to grid coordinates for persistent storage
			gridCoordinates: {
				x: Math.round(graphicHelper.viewport.x / graphicHelper.viewport.vGrid),
				y: Math.round(graphicHelper.viewport.y / graphicHelper.viewport.hGrid),
			},
		},
		binaryAssets: state.binaryAssets,
		compiledModules: options?.includeCompiled ? compiler.compiledModules : undefined,
		postProcessEffects: graphicHelper.postProcessEffects,
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

/**
 * Serializes current runtime state to runtime-ready Project format.
 * Includes compiled WASM, memory snapshot, and compiled config.
 * This is async because it compiles config blocks on-demand.
 * @param state Current editor state
 * @param encodeToBase64 Function to encode binary data to base64
 * @returns Promise resolving to Project object ready for serialization to JSON
 */
export async function serializeToRuntimeReadyProject(
	state: State,
	encodeToBase64: (data: Uint8Array) => string
): Promise<Project> {
	// Start with the base serialization
	const project = serializeToProject(state, { includeCompiled: true, encodeToBase64 });

	// Compile config on-demand for runtime-ready export
	const compiledConfig = await compileConfigForExport(state);
	if (Object.keys(compiledConfig).length > 0) {
		project.compiledConfig = compiledConfig;
	}

	return project;
}
