import type { CodeBlock, CodeBlockGraphicData, Project, State } from '../types';

/**
 * Converts graphic data code blocks to simplified project structure for serialization
 * @param codeBlocks Array of code blocks with full graphic data
 * @param vGrid Vertical grid size (for converting pixel coordinates to grid coordinates)
 * @param hGrid Horizontal grid size (for converting pixel coordinates to grid coordinates)
 * @returns Array of simplified code blocks suitable for file format
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
			x: codeBlock.gridX,
			y: codeBlock.gridY,
			viewport:
				codeBlock.codeBlocks.size > 0
					? {
							x: Math.round(codeBlock.viewport.x / vGrid),
							y: Math.round(codeBlock.viewport.y / hGrid),
						}
					: undefined,
			codeBlocks:
				codeBlock.codeBlocks.size > 0
					? convertGraphicDataToProjectStructure(Array.from(codeBlock.codeBlocks), vGrid, hGrid)
					: undefined,
		}));
}

/**
 * Serializes current runtime state to Project format for saving to file
 * @param state Current editor state
 * @param options Optional parameters for serialization
 * @param options.includeCompiled If true, includes compiledWasm and memorySnapshot (for runtime-ready projects)
 * @returns Project object ready for serialization to JSON
 */
export function serializeToProject(
	state: State,
	options?: { includeCompiled?: boolean; encodeToBase64?: (data: Uint8Array) => string }
): Project {
	const { graphicHelper, compiler, projectInfo } = state;

	const project: Project = {
		title: projectInfo.title,
		author: projectInfo.author,
		description: projectInfo.description,
		codeBlocks: convertGraphicDataToProjectStructure(
			Array.from(graphicHelper.activeViewport.codeBlocks),
			graphicHelper.globalViewport.vGrid,
			graphicHelper.globalViewport.hGrid
		),
		viewport: {
			x: Math.round(graphicHelper.activeViewport.viewport.x / graphicHelper.globalViewport.vGrid),
			y: Math.round(graphicHelper.activeViewport.viewport.y / graphicHelper.globalViewport.hGrid),
		},
		selectedRuntime: compiler.selectedRuntime,
		runtimeSettings: compiler.runtimeSettings,
		binaryAssets: compiler.binaryAssets,
		compiledModules: compiler.compiledModules,
		memorySizeBytes: compiler.compilerOptions.memorySizeBytes,
		postProcessEffects: graphicHelper.postProcessEffects,
	};

	// Optionally include compiled WASM and memory snapshot for runtime-ready exports
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
