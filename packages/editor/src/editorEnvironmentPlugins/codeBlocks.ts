import type { CodeBlockGraphicData, State } from '@8f4e/editor-state-types';

export function getActiveCodeBlocksForEnvironmentPlugins(state: State): CodeBlockGraphicData[] {
	const blocks = [...state.codeBlockRendering.codeBlocks];
	const selectedBlock = state.codeBlockRendering.selectedCodeBlock;

	if (selectedBlock && !blocks.some(block => block.id === selectedBlock.id)) {
		blocks.push(selectedBlock);
	}

	return blocks;
}
