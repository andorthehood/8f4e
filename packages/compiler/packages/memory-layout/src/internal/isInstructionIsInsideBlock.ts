import { BLOCK_TYPE, type PublicMemoryLayoutContext } from '../types';

export function isInstructionIsInsideBlock(
	blockStack: PublicMemoryLayoutContext['blockStack'],
	blockType: BLOCK_TYPE
): boolean {
	return blockStack.some(block => block.blockType === blockType);
}
