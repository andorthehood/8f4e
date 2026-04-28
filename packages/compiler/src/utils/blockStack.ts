import { BLOCK_TYPE } from '../types';

import type { BlockStack } from '../types';

export function isInstructionIsInsideAModule(blockStack: BlockStack) {
	return hasBlockType(blockStack, BLOCK_TYPE.MODULE);
}

export function isInstructionInsideFunction(blockStack: BlockStack) {
	return hasBlockType(blockStack, BLOCK_TYPE.FUNCTION);
}

export function isInstructionInsideModuleOrFunction(blockStack: BlockStack) {
	return isInstructionIsInsideAModule(blockStack) || isInstructionInsideFunction(blockStack);
}

export function isInstructionIsInsideBlock(blockStack: BlockStack, blockType: BLOCK_TYPE) {
	return hasBlockType(blockStack, blockType);
}

function hasBlockType(blockStack: BlockStack, blockType: BLOCK_TYPE) {
	for (let i = blockStack.length - 1; i >= 0; i--) {
		if (blockStack[i].blockType === blockType) {
			return true;
		}
	}
	return false;
}
