import { type BLOCK_TYPE, type SymbolResolutionContext } from '../types';

export function isInstructionInsideBlock(
	blockStack: SymbolResolutionContext['blockStack'],
	blockType: BLOCK_TYPE
): boolean {
	return blockStack.some(block => block.blockType === blockType);
}
