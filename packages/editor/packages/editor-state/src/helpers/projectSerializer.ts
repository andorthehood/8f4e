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
							x: Math.round(codeBlock.x / vGrid),
							y: Math.round(codeBlock.y / hGrid),
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
 * @returns Project object ready for serialization to JSON
 */
export function serializeToProject(state: State): Project {
	const { graphicHelper, compiler } = state;

	return {
		title: state.project.title,
		author: state.project.author,
		description: state.project.description,
		codeBlocks: convertGraphicDataToProjectStructure(
			Array.from(graphicHelper.activeViewport.codeBlocks),
			graphicHelper.globalViewport.vGrid,
			graphicHelper.globalViewport.hGrid
		),
		viewport: {
			x: Math.round(graphicHelper.activeViewport.viewport.x / graphicHelper.globalViewport.vGrid),
			y: Math.round(graphicHelper.activeViewport.viewport.y / graphicHelper.globalViewport.hGrid),
		},
		selectedRuntime: state.project.selectedRuntime,
		runtimeSettings: state.project.runtimeSettings,
		binaryAssets: state.project.binaryAssets,
		compiledModules: compiler.compiledModules,
		memorySizeBytes: compiler.compilerOptions.memorySizeBytes,
		postProcessEffects: state.project.postProcessEffects,
	};
}

/**
 * Deserializes Project format into runtime state
 * This is called when loading a project from file or storage
 * @param project Project data to deserialize
 * @param state Current state to populate
 */
export function deserializeFromProject(project: Project, state: State): void {
	// Populate state.project for backward compatibility during migration
	// This will be removed in Step 9
	state.project = {
		...state.project,
		...project,
	};
}
