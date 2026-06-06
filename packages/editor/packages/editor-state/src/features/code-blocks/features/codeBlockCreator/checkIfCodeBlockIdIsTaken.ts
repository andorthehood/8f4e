import type { State } from '@8f4e/editor-state-types';

export function checkIfCodeBlockIdIsTaken(
	state: State,
	blockType: 'module' | 'function' | 'prototype',
	id: string
): boolean {
	const typedId = `${blockType}_${id}`;
	return state.codeBlockRendering.codeBlocks.some(codeBlock => codeBlock.name === typedId);
}
