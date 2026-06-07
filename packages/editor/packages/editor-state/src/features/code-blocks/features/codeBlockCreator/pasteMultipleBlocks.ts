import type { CodeBlockGraphicData, State } from '@8f4e/editor-state-types';
import type { StateManager } from '@8f4e/state-manager';
import getBlockType from '../../utils/codeParsers/getBlockType';
import { createCodeBlockGraphicData } from '../../utils/createCodeBlockGraphicData';
import getCodeBlockId from '../../utils/getCodeBlockId';
import { renameInterModuleReferences } from '../../utils/renameInterModuleReferences';
import type { ClipboardCodeBlock } from '../clipboard/clipboardUtils';
import upsertPos from '../directives/pos/upsert';
import { hasDirective } from '../directives/utils';
import { extractGroupName } from '../group/extractGroupName';
import { createGroupNameMapping } from '../group/getUniqueGroupName';
import { replaceGroupName } from '../group/replaceGroupName';

/**
 * Updates inter-module references in code when pasting multiple blocks.
 * Replaces old module/function names with new ones based on the name mapping.
 * Handles current inter-module reference forms such as &module:memory, module:memory&, module:&, count(module:memory), sizeof(module:memory), max(module:memory), and min(module:memory).
 */
export function updateInterModuleReferences(code: string[], nameMapping: Map<string, string>): string[] {
	if (nameMapping.size === 0) {
		return code;
	}

	let updatedCode = code;
	for (const [oldName, newName] of nameMapping.entries()) {
		updatedCode = renameInterModuleReferences(updatedCode, oldName, newName);
	}

	return updatedCode;
}

function incrementCodeBlockName(name: string): string {
	if (/.*[0-9]+$/gm.test(name)) {
		const [, trailingNumber] = name.match(/.*([0-9]+$)/) as [never, string];
		return name.replace(new RegExp(trailingNumber + '$'), `${parseInt(trailingNumber, 10) + 1}`);
	} else {
		return name + '2';
	}
}

function changeCodeBlockNameInCode(code: string[], instruction: string, name: string): string[] {
	const instructionParser = /^([a-zA-Z][a-zA-Z0-9]*)\s+([a-zA-Z_][a-zA-Z0-9_-]*)/;
	return code.map(line => {
		const match = line.match(instructionParser) as RegExpMatchArray | null;
		if (match && match[1] === instruction && match[2]) {
			// Reconstruct line with new name, preserving spacing and everything after it.
			const beforeInstruction = line.slice(0, match.index!);
			const matchedInstruction = match[1];
			const spacingAfterInstruction = line.slice(
				match.index! + matchedInstruction.length,
				line.indexOf(match[2], match.index!)
			);
			const afterOldId = line.slice(line.indexOf(match[2], match.index!) + match[2].length);
			return beforeInstruction + matchedInstruction + spacingAfterInstruction + name + afterOldId;
		}
		return line;
	});
}

/**
 * Handles pasting multiple blocks from clipboard with collision resolution and reference updating.
 * This function:
 * - Resolves name collisions for pasted blocks (including duplicates within the paste)
 * - Updates inter-module references when names change
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
	const groupNameMapping = createGroupNameMapping(pastedGroupNames, state.codeBlockRendering.codeBlocks);

	// First pass: determine name mappings for all pasted blocks.
	const nameMapping = new Map<string, string[]>(); // Maps `<type>:<originalName>` to array of new names.
	const processedNames = new Set<string>(); // Track `<type>:<newName>` already assigned.

	// Build list of all original names in order.
	const originalNames: Array<{ type: 'module' | 'function'; name: string; index: number }> = [];
	blocks.forEach((clipboardBlock, index) => {
		const code = [...clipboardBlock.code];
		const blockType = getBlockType(code);
		const blockName = getCodeBlockId(code);
		if (blockType === 'function' && blockName) {
			originalNames.push({ type: 'function', name: blockName, index });
		} else if (blockType === 'module' && blockName) {
			originalNames.push({ type: 'module', name: blockName, index });
		}
	});

	// Assign new unique names for each occurrence.
	for (const { type, name: originalName } of originalNames) {
		let newName = originalName;
		while (
			state.codeBlockRendering.codeBlocks.some(
				codeBlock =>
					(codeBlock.blockType === type || codeBlock.code[0]?.trim().startsWith(`${type} `)) &&
					codeBlock.name === newName
			) ||
			processedNames.has(`${type}:${newName}`)
		) {
			newName = incrementCodeBlockName(newName);
		}

		const key = `${type}:${originalName}`;
		if (!nameMapping.has(key)) {
			nameMapping.set(key, []);
		}
		nameMapping.get(key)!.push(newName);
		processedNames.add(`${type}:${newName}`);
	}

	// Second pass: create blocks with updated names and inter-module references.
	const newBlocks: CodeBlockGraphicData[] = [];
	const occurrenceCounters = new Map<string, number>(); // Track which occurrence we're on for each original name.

	for (const clipboardBlock of blocks) {
		// Calculate absolute grid position
		const gridX = anchorGridX + clipboardBlock.gridCoordinates.x;
		const gridY = anchorGridY + clipboardBlock.gridCoordinates.y;

		// Process code: update names, inter-module references, and rename groups.
		let code = [...clipboardBlock.code];

		// Update module/function names to ensure uniqueness.
		const blockType = getBlockType(code);
		const originalName = getCodeBlockId(code);
		const originalType = blockType === 'function' ? 'function' : blockType === 'module' ? 'module' : undefined;

		if (originalName && originalType) {
			const key = `${originalType}:${originalName}`;
			const occurrenceIndex = occurrenceCounters.get(key) || 0;
			occurrenceCounters.set(key, occurrenceIndex + 1);

			const newNames = nameMapping.get(key) || [];
			const newName = newNames[occurrenceIndex] || originalName;

			if (blockType === 'function') {
				code = changeCodeBlockNameInCode(code, 'function', newName);
			} else if (blockType === 'module') {
				code = changeCodeBlockNameInCode(code, 'module', newName);
			}
		}

		// Update inter-module references in the code
		// Build a simple name mapping from first occurrence of each original name to its new name.
		const simpleNameMapping = new Map<string, string>();
		for (const [mappingKey, newNameArray] of nameMapping.entries()) {
			const [, originalMappedName] = mappingKey.split(':');
			if (newNameArray.length > 0) {
				simpleNameMapping.set(originalMappedName, newNameArray[0]);
			}
		}
		code = updateInterModuleReferences(code, simpleNameMapping);

		// Rename group if needed
		const originalGroupName = extractGroupName(code);
		if (originalGroupName && groupNameMapping.has(originalGroupName)) {
			const newGroupName = groupNameMapping.get(originalGroupName)!;
			// Replace the group name in the code
			code = code.map(line => replaceGroupName(line, originalGroupName, newGroupName));
		}

		// Add canonical @pos directive to code
		code = upsertPos(code, gridX, gridY);

		// Parse disabled state from @disabled directive in code
		const disabled = hasDirective(code, 'disabled');

		const creationIndex = state.codeBlockRendering.nextCodeBlockCreationIndex;
		state.codeBlockRendering.nextCodeBlockCreationIndex++;

		const codeBlock = createCodeBlockGraphicData({
			code,
			name: getCodeBlockId(code),
			gridX,
			gridY,
			x: gridX * state.viewport.vGrid,
			y: gridY * state.viewport.hGrid,
			creationIndex,
			disabled,
			alwaysOnTop: hasDirective(code, 'alwaysOnTop'),
		});

		// Add block immediately so next iteration's ID uniqueness check sees it
		state.codeBlockRendering.codeBlocks.push(codeBlock);
		newBlocks.push(codeBlock);
	}

	// Stable-sort to maintain the partition: normal blocks first, always-on-top last.
	const sorted = [
		...state.codeBlockRendering.codeBlocks.filter(b => !b.alwaysOnTop),
		...state.codeBlockRendering.codeBlocks.filter(b => b.alwaysOnTop),
	];

	// Trigger single store update with all new blocks
	store.set('codeBlockRendering.codeBlocks', sorted);
}
