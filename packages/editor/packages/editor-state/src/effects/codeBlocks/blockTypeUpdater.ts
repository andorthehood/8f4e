import { StateManager } from '@8f4e/state-manager';

import getBlockType from '../../helpers/codeParsers/getBlockType';

import type { CodeBlockGraphicData, EventDispatcher, State } from '../../types';

interface CodeBlockAddedEvent {
	codeBlock: CodeBlockGraphicData;
}

/**
 * Effect that keeps the blockType field in sync with code block contents.
 * Updates blockType on:
 * - codeBlockAdded: When a new code block is created
 * - projectLoaded: When a project is loaded (recompute all block types)
 * - code changes: When the selected code block's code changes
 */
export default function blockTypeUpdater(store: StateManager<State>, events: EventDispatcher): void {
	const state = store.getState();

	/**
	 * Update blockType for a single code block
	 */
	function updateBlockType(codeBlock: CodeBlockGraphicData): void {
		codeBlock.blockType = getBlockType(codeBlock.code);
	}

	/**
	 * Update blockType for all code blocks
	 */
	function updateAllBlockTypes(): void {
		for (const codeBlock of state.graphicHelper.codeBlocks) {
			updateBlockType(codeBlock);
		}
	}

	/**
	 * Update blockType when a new code block is added
	 */
	function onCodeBlockAdded({ codeBlock }: CodeBlockAddedEvent): void {
		updateBlockType(codeBlock);
	}

	/**
	 * Update blockType when the selected code block's code changes
	 */
	function onSelectedCodeBlockCodeChange(): void {
		if (state.graphicHelper.selectedCodeBlock) {
			updateBlockType(state.graphicHelper.selectedCodeBlock);
		}
	}

	events.on<CodeBlockAddedEvent>('codeBlockAdded', onCodeBlockAdded);
	events.on('projectLoaded', updateAllBlockTypes);
	store.subscribe('graphicHelper.selectedCodeBlock.code', onSelectedCodeBlockCodeChange);
}
