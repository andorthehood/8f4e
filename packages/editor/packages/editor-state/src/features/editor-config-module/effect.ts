import { StateManager } from '@8f4e/state-manager';
import { getBlockType } from '@8f4e/compiler/syntax';

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
				const gridX = rawBlock.gridCoordinates?.x ?? 0;
				const gridY = rawBlock.gridCoordinates?.y ?? 0;
				const parsedDirectives = parseBlockDirectives(rawBlock.code);
				const directiveState = deriveDirectiveState(rawBlock.code, parsedDirectives);
				const blockType = getBlockType(rawBlock.code) as CodeBlockGraphicData['blockType'];

				nextCodeBlocks.push(
					createCodeBlockGraphicData({
						id: getCodeBlockId(rawBlock.code),
						code: rawBlock.code,
						disabled: directiveState.blockState.disabled,
						isHome: directiveState.blockState.isHome,
						isFavorite: directiveState.blockState.isFavorite,
						parsedDirectives,
						creationIndex,
						blockType,
						gridX,
						gridY,
						x: gridX * state.viewport.vGrid,
						y: gridY * state.viewport.hGrid,
					})
				);

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
