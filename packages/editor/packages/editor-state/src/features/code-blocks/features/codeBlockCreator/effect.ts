import { instructionParser } from '@8f4e/compiler/syntax';
import { getModuleId } from '@8f4e/compiler/syntax';
import { getFunctionId } from '@8f4e/compiler/syntax';

import { insertDependencies } from './insertDependencies';

import { type ClipboardCodeBlock } from '../clipboard/clipboardUtils';
import { parseClipboardData, extractGroupNameFromCode } from '../clipboard/clipboardUtils';
import { createGroupNameMapping } from '../group/getUniqueGroupName';
import { replaceGroupName } from '../group/replaceGroupName';
import getCodeBlockId from '../../utils/getCodeBlockId';
import { createCodeBlockGraphicData } from '../../utils/createCodeBlockGraphicData';

import type { StateManager } from '@8f4e/state-manager';
import type { CodeBlockGraphicData, State, EventDispatcher } from '~/types';

const nameList = [
	'quark',
	'electron',
	'positron',
	'muon',
	'tau',
	'neutrino',
	'photon',
	'gluon',
	'boson',
	'lepton',
	'axion',
	'curvaton',
	'dilaton',
	'graviton',
	'inflaton',
	'majoron',
	'preon',
	'tachyon',
	'pion',
	'baryon',
	'proton',
	'neutron',
	'nucleon',
	'kaon',
	'meson',
	'hadron',
	'dropleton',
	'anyon',
	'exciton',
	'fracton',
	'magnon',
	'plasmon',
	'polariton',
	'polaron',
	'roton',
	'trion',
];

function getRandomCodeBlockId() {
	return nameList[Math.floor(Math.random() * nameList.length)];
}

function checkIfCodeBlockIdIsTaken(state: State, id: string) {
	return state.graphicHelper.codeBlocks.some(codeBlock => {
		return codeBlock.id === id;
	});
}

function changeCodeBlockIdInCode(code: string[], instruction: string, id: string) {
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

function incrementCodeBlockId(id: string) {
	if (/.*[0-9]+$/gm.test(id)) {
		const [, trailingNumber] = id.match(/.*([0-9]+$)/) as [never, string];
		return id.replace(new RegExp(trailingNumber + '$'), `${parseInt(trailingNumber, 10) + 1}`);
	} else {
		return id + '2';
	}
}

function incrementCodeBlockIdUntilUnique(state: State, blockId: string) {
	while (checkIfCodeBlockIdIsTaken(state, blockId)) {
		blockId = incrementCodeBlockId(blockId);
	}
	return blockId;
}

export default function codeBlockCreator(store: StateManager<State>, events: EventDispatcher): void {
	const state = store.getState();
	async function onAddCodeBlock({
		x,
		y,
		isNew,
		blockType,
		code = [''],
	}: {
		x: number;
		y: number;
		isNew: boolean;
		blockType?: 'module' | 'function' | 'vertexShader' | 'fragmentShader' | 'comment';
		code?: string[];
	}) {
		if (!state.featureFlags.editing) {
			return;
		}

		const hasExplicitCode = code.length > 1 || (code.length === 1 && code[0].trim().length > 0);

		if (isNew && !hasExplicitCode) {
			if (blockType === 'function') {
				code = ['function ' + getRandomCodeBlockId(), '', '', 'functionEnd'];
			} else if (blockType === 'vertexShader') {
				code = ['vertexShader', '', '', 'vertexShaderEnd'];
			} else if (blockType === 'fragmentShader') {
				code = ['fragmentShader', '', '', 'fragmentShaderEnd'];
			} else if (blockType === 'comment') {
				code = ['comment', '', '', 'commentEnd'];
			} else {
				code = ['module ' + getRandomCodeBlockId(), '', '', 'moduleEnd'];
			}
		} else if (code.length < 2) {
			// If no callback is provided, fail silently
			if (!state.callbacks.readClipboardText) {
				return;
			}

			try {
				const clipboardText = await state.callbacks.readClipboardText();
				const parsedData = parseClipboardData(clipboardText);

				if (parsedData.type === 'multi') {
					// Multi-block paste
					onPasteMultipleBlocks({ x, y, blocks: parsedData.blocks });
					return;
				} else {
					// Single-block paste
					code = parsedData.text.split('\n');
				}
			} catch {
				// Fail silently if clipboard read fails
				return;
			}
		}

		// Update ID based on block type
		const moduleId = getModuleId(code);
		const functionId = getFunctionId(code);

		if (functionId) {
			code = changeCodeBlockIdInCode(code, 'function', incrementCodeBlockIdUntilUnique(state, functionId));
		} else if (moduleId) {
			code = changeCodeBlockIdInCode(code, 'module', incrementCodeBlockIdUntilUnique(state, moduleId));
		}

		const creationIndex = state.graphicHelper.nextCodeBlockCreationIndex;
		state.graphicHelper.nextCodeBlockCreationIndex++;

		const codeBlock: CodeBlockGraphicData = {
			width: 0,
			height: 0,
			code,
			codeColors: [],
			codeToRender: [],
			extras: {
				blockHighlights: [],
				inputs: [],
				outputs: [],
				debuggers: [],
				switches: [],
				buttons: [],
				sliders: [],
				pianoKeyboards: [],
				bufferPlotters: [],
				bufferScanners: [],
				errorMessages: [],
			},
			cursor: { col: 0, row: 0, x: 0, y: 0 },
			id: getCodeBlockId(code),
			gaps: new Map(),
			gridX: Math.round((state.viewport.x + x) / state.viewport.vGrid),
			gridY: Math.round((state.viewport.y + y) / state.viewport.hGrid),
			x: state.viewport.x + x,
			y: state.viewport.y + y,
			lineNumberColumnWidth: 2,
			offsetX: 0,
			lastUpdated: Date.now(),
			offsetY: 0,
			creationIndex,
			blockType: 'unknown', // Will be updated by blockTypeUpdater effect
			disabled: false,
		};

		store.set('graphicHelper.codeBlocks', [...state.graphicHelper.codeBlocks, codeBlock]);
	}

	/**
	 * Updates inter-module references in code when pasting multiple blocks.
	 * Replaces old module/function IDs with new ones based on the ID mapping.
	 * Handles references like &module.memory, module.memory&, $module.memory, %module.memory
	 */
	function updateInterModuleReferences(code: string[], idMapping: Map<string, string>): string[] {
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
	 * Escapes special regex characters in a string
	 */
	function escapeRegex(str: string): string {
		return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	}

	function onPasteMultipleBlocks({ x, y, blocks }: { x: number; y: number; blocks: ClipboardCodeBlock[] }): void {
		if (!state.featureFlags.editing) {
			return;
		}

		// Calculate paste anchor grid position
		const anchorGridX = Math.round((state.viewport.x + x) / state.viewport.vGrid);
		const anchorGridY = Math.round((state.viewport.y + y) / state.viewport.hGrid);

		// Extract all group names from pasted blocks
		const pastedGroupNames: string[] = [];
		for (const block of blocks) {
			const groupName = extractGroupNameFromCode(block.code);
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
			const originalGroupName = extractGroupNameFromCode(code);
			if (originalGroupName && groupNameMapping.has(originalGroupName)) {
				const newGroupName = groupNameMapping.get(originalGroupName)!;
				// Replace the group name in the code
				code = code.map(line => replaceGroupName(line, originalGroupName, newGroupName));
			}

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

	function onDeleteCodeBlock({ codeBlock }: { codeBlock: CodeBlockGraphicData }): void {
		if (!state.featureFlags.editing) {
			return;
		}

		store.set(
			'graphicHelper.codeBlocks',
			state.graphicHelper.codeBlocks.filter(block => block !== codeBlock)
		);
	}

	function onCopyCodeBlock({ codeBlock }: { codeBlock: CodeBlockGraphicData }): void {
		// Use callback if available, otherwise fail silently
		if (state.callbacks.writeClipboardText) {
			state.callbacks.writeClipboardText(codeBlock.code.join('\n')).catch(() => {
				// Fail silently if clipboard write fails
				return undefined;
			});
		}
	}

	function onToggleCodeBlockDisabled({ codeBlock }: { codeBlock: CodeBlockGraphicData }): void {
		if (!state.featureFlags.editing) {
			return;
		}

		// Toggle disabled state
		codeBlock.disabled = !codeBlock.disabled;
		// Update lastUpdated to invalidate cache
		codeBlock.lastUpdated = Date.now();
		// Trigger store update to re-render
		store.set('graphicHelper.codeBlocks', [...state.graphicHelper.codeBlocks]);
	}

	async function onAddCodeBlockBySlug({
		codeBlockSlug,
		x,
		y,
	}: {
		codeBlockSlug: string;
		x: number;
		y: number;
	}): Promise<void> {
		if (!state.callbacks.getModule) {
			console.warn('No getCodeBlock callback provided');
			return;
		}

		// Load the requested module
		const requestedModule = await state.callbacks.getModule(codeBlockSlug);

		// Add the requested module at the clicked position
		const requestedCode = requestedModule.code.split('\n');
		onAddCodeBlock({ code: requestedCode, x, y, isNew: false });

		// If the module has dependencies, insert them to the right
		if (requestedModule.dependencies && requestedModule.dependencies.length > 0) {
			await insertDependencies({
				dependencies: requestedModule.dependencies,
				getModule: state.callbacks.getModule,
				requestedModuleCode: requestedCode,
				clickX: x,
				clickY: y,
				state,
				onAddCodeBlock,
			});
		}
	}

	events.on('addCodeBlockBySlug', onAddCodeBlockBySlug);
	events.on('addCodeBlock', onAddCodeBlock);
	events.on('copyCodeBlock', onCopyCodeBlock);
	events.on('deleteCodeBlock', onDeleteCodeBlock);
	events.on('toggleCodeBlockDisabled', onToggleCodeBlockDisabled);
}
