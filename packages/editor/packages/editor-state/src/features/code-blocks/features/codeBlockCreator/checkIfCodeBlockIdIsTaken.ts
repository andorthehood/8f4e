import type { State } from '~/types';

export function checkIfCodeBlockIdIsTaken(state: State, blockType: 'module' | 'function', id: string): boolean {
	const typedId = `${blockType}_${id}`;
	return state.graphicHelper.codeBlocks.some(codeBlock => codeBlock.id === typedId);
}
