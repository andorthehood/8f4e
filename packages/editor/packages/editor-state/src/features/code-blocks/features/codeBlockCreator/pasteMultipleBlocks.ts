import { getModuleId, getFunctionId } from '@8f4e/compiler/syntax';

import { type ClipboardCodeBlock } from '../clipboard/clipboardUtils';
import { extractGroupName } from '../group/extractGroupName';
import { createGroupNameMapping } from '../group/getUniqueGroupName';
import { replaceGroupName } from '../group/replaceGroupName';
import getCodeBlockId from '../../utils/getCodeBlockId';
import { createCodeBlockGraphicData } from '../../utils/createCodeBlockGraphicData';
import upsertPos from '../position/upsertPos';

import type { StateManager } from '@8f4e/state-manager';
import type { CodeBlockGraphicData, State } from '~/types';

/**
 * Escapes special regex characters in a string
 */
function escapeRegex(str: string): string {
	return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Updates inter-module references in code when pasting multiple blocks.
 * Replaces old module/function IDs with new ones based on the ID mapping.
 * Handles references like &module.memory, module.memory&, $module.memory, %module.memory
 */
export function updateInterModuleReferences(code: string[], idMapping: Map<string, string>): string[] {
	if (idMapping.size === 0) {
		return code;
	}

	return code.map(line => {
		let updatedLine = line;

		// Update each old ID to new ID in the line
		for (const [oldId, newId] of idMapping.entries()) {
			// Use word boundaries to match complete module/function names
			// Matches patterns like: &oldId.memory, oldId.memory&, $oldId.memory, %oldId.memory
			const patterns = [
				new RegExp(`\\b${escapeRegex(oldId)}\\.`, 'g'), // oldId. (covers &oldId., $oldId., %oldId.)
				new RegExp(`\\.${escapeRegex(oldId)}\\b`, 'g'), // .oldId (for things like memory.oldId)
			];

			for (const pattern of patterns) {
				updatedLine = updatedLine.replace(pattern, match => {
					return match.replace(oldId, newId);
				});
			}
		}

		return updatedLine;
	});
}

/**
 * Helper function to check if a code block ID is already taken
 */
function checkIfCodeBlockIdIsTaken(state: State, id: string): boolean {
	return state.graphicHelper.codeBlocks.some(codeBlock => {
		return codeBlock.id === id;
	});
}

/**
 * Helper function to increment a code block ID
 */
function incrementCodeBlockId(id: string): string {
	if (/.*[0-9]+$/gm.test(id)) {
		const [, trailingNumber] = id.match(/.*([0-9]+$)/) as [never, string];
		return id.replace(new RegExp(trailingNumber + '$'), `${parseInt(trailingNumber, 10) + 1}`);
	} else {
		return id + '2';
	}
}

/**
 * Helper function to change the code block ID in code
 */
function changeCodeBlockIdInCode(code: string[], instruction: string, id: string): string[] {
	const instructionParser = /^([a-zA-Z][a-zA-Z0-9]*)\s+([a-zA-Z_][a-zA-Z0-9_-]*)/;
	return code.map(line => {
		const match = line.match(instructionParser) as RegExpMatchArray | null;
		if (match && match[1] === instruction && match[2]) {
			// Reconstruct line with new ID, preserving spacing and everything after the ID
			const beforeInstruction = line.slice(0, match.index!);
			const matchedInstruction = match[1];
			const spacingAfterInstruction = line.slice(
				match.index! + matchedInstruction.length,
				line.indexOf(match[2], match.index!)
			);
			const afterOldId = line.slice(line.indexOf(match[2], match.index!) + match[2].length);
			return beforeInstruction + matchedInstruction + spacingAfterInstruction + id + afterOldId;
		}
		return line;
	});
}

/**
 * Handles pasting multiple blocks from clipboard with collision resolution and reference updating.
 * This function:
 * - Resolves ID collisions for pasted blocks (including duplicates within the paste)
 * - Updates inter-module references when IDs change
 * - Renames group names to avoid collisions
 * - Maintains relative positioning between blocks
 */
export function pasteMultipleBlocks(
	store: StateManager<State>,
	{
		x,
		y,
		blocks,
	}: {
		x: number;
		y: number;
		blocks: ClipboardCodeBlock[];
	}
): void {
	const state = store.getState();

	if (!state.featureFlags.editing) {
		return;
	}

	// Calculate paste anchor grid position
	const anchorGridX = Math.round((state.viewport.x + x) / state.viewport.vGrid);
	const anchorGridY = Math.round((state.viewport.y + y) / state.viewport.hGrid);

	// Extract all group names from pasted blocks
	const pastedGroupNames: string[] = [];
	for (const block of blocks) {
		const groupName = extractGroupName(block.code);
		if (groupName) {
			pastedGroupNames.push(groupName);
		}
	}

	// Create group name mapping to avoid collisions
	const groupNameMapping = createGroupNameMapping(pastedGroupNames, state.graphicHelper.codeBlocks);

	// First pass: determine ID mappings for all pasted blocks
	// We need to handle cases where multiple pasted blocks have the same original ID
	const idMapping = new Map<string, string[]>(); // Maps original ID to array of new IDs (one per occurrence)
	const processedIds = new Set<string>(); // Track which IDs we've already assigned

	// Build list of all original IDs in order
	const originalIds: Array<{ type: 'module' | 'function'; id: string; index: number }> = [];
	blocks.forEach((clipboardBlock, index) => {
		const code = [...clipboardBlock.code];
		const moduleId = getModuleId(code);
		const functionId = getFunctionId(code);
		if (functionId) {
			originalIds.push({ type: 'function', id: functionId, index });
		} else if (moduleId) {
			originalIds.push({ type: 'module', id: moduleId, index });
		}
	});

	// Assign new unique IDs for each occurrence
	for (const { id: originalId } of originalIds) {
		let newId = originalId;
		while (checkIfCodeBlockIdIsTaken(state, newId) || processedIds.has(newId)) {
			newId = incrementCodeBlockId(newId);
		}

		if (!idMapping.has(originalId)) {
			idMapping.set(originalId, []);
		}
		idMapping.get(originalId)!.push(newId);
		processedIds.add(newId);
	}

	// Second pass: create blocks with updated IDs and inter-module references
	const newBlocks: CodeBlockGraphicData[] = [];
	const occurrenceCounters = new Map<string, number>(); // Track which occurrence we're on for each original ID

	for (const clipboardBlock of blocks) {
		// Calculate absolute grid position
		const gridX = anchorGridX + clipboardBlock.gridCoordinates.x;
		const gridY = anchorGridY + clipboardBlock.gridCoordinates.y;

		// Process code: update IDs, inter-module references, and rename groups
		let code = [...clipboardBlock.code];

		// Update module/function IDs to ensure uniqueness
		const moduleId = getModuleId(code);
		const functionId = getFunctionId(code);
		const originalId = functionId || moduleId;

		if (originalId) {
			// Get the next new ID for this original ID
			const occurrenceIndex = occurrenceCounters.get(originalId) || 0;
			occurrenceCounters.set(originalId, occurrenceIndex + 1);

			const newIds = idMapping.get(originalId) || [];
			const newId = newIds[occurrenceIndex] || originalId;

			if (functionId) {
				code = changeCodeBlockIdInCode(code, 'function', newId);
			} else if (moduleId) {
				code = changeCodeBlockIdInCode(code, 'module', newId);
			}
		}

		// Update inter-module references in the code
		// Build a simple ID mapping from first occurrence of each original ID to its new ID
		const simpleIdMapping = new Map<string, string>();
		for (const [origId, newIdArray] of idMapping.entries()) {
			if (newIdArray.length > 0) {
				simpleIdMapping.set(origId, newIdArray[0]);
			}
		}
		code = updateInterModuleReferences(code, simpleIdMapping);

		// Rename group if needed
		const originalGroupName = extractGroupName(code);
		if (originalGroupName && groupNameMapping.has(originalGroupName)) {
			const newGroupName = groupNameMapping.get(originalGroupName)!;
			// Replace the group name in the code
			code = code.map(line => replaceGroupName(line, originalGroupName, newGroupName));
		}

		// Add canonical @pos directive to code
		code = upsertPos(code, gridX, gridY);

		const creationIndex = state.graphicHelper.nextCodeBlockCreationIndex;
		state.graphicHelper.nextCodeBlockCreationIndex++;

		const codeBlock = createCodeBlockGraphicData({
			code,
			id: getCodeBlockId(code),
			gridX,
			gridY,
			x: gridX * state.viewport.vGrid,
			y: gridY * state.viewport.hGrid,
			creationIndex,
			disabled: clipboardBlock.disabled ?? false,
		});

		// Add block immediately so next iteration's ID uniqueness check sees it
		state.graphicHelper.codeBlocks.push(codeBlock);
		newBlocks.push(codeBlock);
	}

	// Trigger single store update with all new blocks
	store.set('graphicHelper.codeBlocks', [...state.graphicHelper.codeBlocks]);
}
