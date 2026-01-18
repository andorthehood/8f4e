import getCodeBlockGridWidth from '../graphicHelper/getCodeBlockGridWidth';
import getCodeBlockId from '../../utils/getCodeBlockId';
import getBlockType from '../../utils/codeParsers/getBlockType';

import type { State, ExampleModule } from '~/types';

interface InsertDependenciesParams {
	dependencies: string[];
	getModule: (slug: string) => Promise<ExampleModule>;
	requestedModuleCode: string[];
	clickX: number;
	clickY: number;
	state: State;
	onAddCodeBlock: (params: { code: string[]; x: number; y: number; isNew: boolean }) => void;
}

/**
 * Inserts dependency modules to the right of the requested module.
 * Skips dependencies that already exist in the editor.
 *
 * @param params - Parameters for dependency insertion
 */
export async function insertDependencies({
	dependencies,
	getModule,
	requestedModuleCode,
	clickX,
	clickY,
	state,
	onAddCodeBlock,
}: InsertDependenciesParams): Promise<void> {
	const vGrid = state.viewport.vGrid;
	const gridGap = 4; // Fixed gap between modules in grid units

	// Calculate the grid width of the requested module
	let currentGridX = Math.round((state.viewport.x + clickX) / vGrid);
	const requestedModuleGridWidth = getCodeBlockGridWidth(requestedModuleCode);
	currentGridX += requestedModuleGridWidth + gridGap;

	// Insert dependencies from left to right
	for (const dependencySlug of dependencies) {
		try {
			const dependencyModule = await getModule(dependencySlug);
			const dependencyCode = dependencyModule.code.split('\n');

			// Get the module ID and type from the dependency code
			const dependencyModuleId = getCodeBlockId(dependencyCode);
			const dependencyBlockType = getBlockType(dependencyCode);

			// Skip if a code block with this moduleId and type already exists
			// Filter by block type first, then check IDs of matching type
			// Use getBlockType to parse the type from code rather than relying on stored blockType
			const existsAlready = state.graphicHelper.codeBlocks.some(block => {
				const blockType = getBlockType(block.code);
				if (blockType !== dependencyBlockType) {
					return false;
				}
				return block.id === dependencyModuleId;
			});

			if (dependencyModuleId && existsAlready) {
				continue;
			}

			// Calculate pixel position from grid position
			const dependencyX = currentGridX * vGrid - state.viewport.x;
			const dependencyY = clickY;

			// Add the dependency
			onAddCodeBlock({ code: dependencyCode, x: dependencyX, y: dependencyY, isNew: false });

			// Move position to the right for the next dependency
			const dependencyGridWidth = getCodeBlockGridWidth(dependencyCode);
			currentGridX += dependencyGridWidth + gridGap;
		} catch (error) {
			console.warn(`Failed to load dependency: ${dependencySlug}`, error);
		}
	}
}
