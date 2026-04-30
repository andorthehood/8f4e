import type { State } from '@8f4e/editor-state-types';

export function checkIfCodeBlockIdIsTaken(state: State, blockType: 'module' | 'function', id: string): boolean {
	const typedId = `${blockType}_${id}`;
	return state.graphicHelper.codeBlocks.some(codeBlock => codeBlock.id === typedId);
}
