import getCodeBlockGridWidth from '../graphicHelper/getCodeBlockGridWidth';
import getCodeBlockId from '../../utils/getCodeBlockId';

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
	const vGrid = state.graphicHelper.viewport.vGrid;
	const gridGap = 4; // Fixed gap between modules in grid units

	// Calculate the grid width of the requested module
	let currentGridX = Math.round((state.graphicHelper.viewport.x + clickX) / vGrid);
	const requestedModuleGridWidth = getCodeBlockGridWidth(requestedModuleCode);
	currentGridX += requestedModuleGridWidth + gridGap;

	// Get existing module IDs to avoid duplicates
	const existingModuleIds = new Set(state.graphicHelper.codeBlocks.map(block => block.id).filter(id => id !== ''));

	// Insert dependencies from left to right
	for (const dependencySlug of dependencies) {
		try {
			const dependencyModule = await getModule(dependencySlug);
			const dependencyCode = dependencyModule.code.split('\n');

			// Get the module ID from the dependency code
			const dependencyModuleId = getCodeBlockId(dependencyCode);

			// Skip if a code block with this moduleId already exists
			if (dependencyModuleId && existingModuleIds.has(dependencyModuleId)) {
				continue;
			}

			// Calculate pixel position from grid position
			const dependencyX = currentGridX * vGrid - state.graphicHelper.viewport.x;
			const dependencyY = clickY;

			// Add the dependency
			onAddCodeBlock({ code: dependencyCode, x: dependencyX, y: dependencyY, isNew: false });

			// Add to existing IDs set to prevent duplicates within this batch
			if (dependencyModuleId) {
				existingModuleIds.add(dependencyModuleId);
			}

			// Move position to the right for the next dependency
			const dependencyGridWidth = getCodeBlockGridWidth(dependencyCode);
			currentGridX += dependencyGridWidth + gridGap;
		} catch (error) {
			console.warn(`Failed to load dependency: ${dependencySlug}`, error);
		}
	}
}
