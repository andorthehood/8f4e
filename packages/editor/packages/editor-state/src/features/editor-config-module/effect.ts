import { StateManager } from '@8f4e/state-manager';
import { getBlockType } from '@8f4e/tokenizer';

import {
	DEFAULT_EDITOR_CONFIG_BLOCK,
	isEditorConfigBlock,
	isEditorConfigCode,
	serializeEditorConfigBlocks,
} from './editorConfigModule';

import { deriveDirectiveState } from '../code-blocks/features/directives/registry';
import { parseBlockDirectives } from '../code-blocks/utils/parseBlockDirectives';
import { createCodeBlockGraphicData } from '../code-blocks/utils/createCodeBlockGraphicData';
import getCodeBlockId from '../code-blocks/utils/getCodeBlockId';
import {
	getCodeBlockGridBounds,
	getCodeBlockGridSizeFromCode,
	placeCodeBlockAtFirstFreeGridY,
} from '../code-blocks/utils/finders/findFirstFreeCodeBlockGridY';
import upsertPos from '../code-blocks/features/directives/pos/upsert';

import type { CodeBlockGraphicData, EventDispatcher, State } from '~/types';

export default function editorConfigModule(store: StateManager<State>, events: EventDispatcher): void {
	const state = store.getState();
	let lastSavedEditorConfigBlocks = '';

	async function populateEditorConfigBlocks() {
		if (!state.initialProjectState || !state.callbacks.loadEditorConfigBlocks) {
			return;
		}

		try {
			const loadedBlocks = (await state.callbacks.loadEditorConfigBlocks()) ?? [];
			const validBlocks = loadedBlocks.filter(block => isEditorConfigCode(block.code));
			const editorConfigBlocks = validBlocks.length > 0 ? validBlocks : [DEFAULT_EDITOR_CONFIG_BLOCK];

			const nextCodeBlocks = [...state.graphicHelper.codeBlocks];
			let creationIndex = state.graphicHelper.nextCodeBlockCreationIndex;

			for (const rawBlock of editorConfigBlocks) {
				const preferredGridX = rawBlock.gridCoordinates?.x ?? 0;
				const preferredGridY = rawBlock.gridCoordinates?.y ?? 0;
				const parsedDirectives = parseBlockDirectives(rawBlock.code);
				const directiveState = deriveDirectiveState(rawBlock.code, parsedDirectives);
				const blockType = getBlockType(rawBlock.code) as CodeBlockGraphicData['blockType'];
				const codeBlock = createCodeBlockGraphicData({
					id: getCodeBlockId(rawBlock.code),
					code: rawBlock.code,
					disabled: directiveState.blockState.disabled,
					isHome: directiveState.blockState.isHome,
					isFavorite: directiveState.blockState.isFavorite,
					opacity: directiveState.blockState.opacity,
					parsedDirectives,
					creationIndex,
					blockType,
					gridX: preferredGridX,
					gridY: preferredGridY,
					x: preferredGridX * state.viewport.vGrid,
					y: preferredGridY * state.viewport.hGrid,
				});
				const targetSize = getCodeBlockGridSizeFromCode(codeBlock);
				const existingBounds = nextCodeBlocks.map(existingCodeBlock =>
					getCodeBlockGridBounds(existingCodeBlock, state.viewport)
				);
				const placement = placeCodeBlockAtFirstFreeGridY(
					{
						x: codeBlock.gridX,
						y: codeBlock.gridY,
						width: targetSize.width,
						height: targetSize.height,
					},
					existingBounds
				);

				codeBlock.gridX = placement.gridX;
				codeBlock.gridY = placement.gridY;
				codeBlock.x = placement.gridX * state.viewport.vGrid;
				codeBlock.y = placement.gridY * state.viewport.hGrid;
				codeBlock.code = upsertPos(codeBlock.code, placement.gridX, placement.gridY);

				nextCodeBlocks.push(codeBlock);

				creationIndex += 1;
			}

			state.graphicHelper.nextCodeBlockCreationIndex = creationIndex;
			store.set('graphicHelper.codeBlocks', nextCodeBlocks);
		} catch (err) {
			console.warn('Failed to load editor config blocks from storage:', err);
		}
	}

	function saveEditorConfigBlocks() {
		if (!state.callbacks.saveEditorConfigBlocks) {
			return;
		}

		const serializedBlocks = serializeEditorConfigBlocks(state.graphicHelper.codeBlocks);
		const nextSnapshot = JSON.stringify(serializedBlocks);
		if (nextSnapshot === lastSavedEditorConfigBlocks) {
			return;
		}

		lastSavedEditorConfigBlocks = nextSnapshot;
		state.callbacks.saveEditorConfigBlocks(serializedBlocks);
	}

	function saveSelectedEditorConfigBlock() {
		if (!isEditorConfigBlock(state.graphicHelper.selectedCodeBlock)) {
			return;
		}

		saveEditorConfigBlocks();
	}

	function saveProgrammaticallyEditedEditorConfigBlock() {
		if (!isEditorConfigBlock(state.graphicHelper.selectedCodeBlockForProgrammaticEdit)) {
			return;
		}

		saveEditorConfigBlocks();
	}

	events.on('projectCodeBlocksPopulated', populateEditorConfigBlocks);
	store.subscribe('graphicHelper.selectedCodeBlock.code', saveSelectedEditorConfigBlock);
	store.subscribe(
		'graphicHelper.selectedCodeBlockForProgrammaticEdit.code',
		saveProgrammaticallyEditedEditorConfigBlock
	);
}
