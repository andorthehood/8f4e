import { BlockType } from '@8f4e/compiler-spec';

import type { BlockStack, BlockTypeValue } from '@8f4e/compiler-spec';

export function isInstructionIsInsideAModule(blockStack: BlockStack) {
	return hasBlockType(blockStack, BlockType.MODULE);
}

export function isInstructionInsideFunction(blockStack: BlockStack) {
	return hasBlockType(blockStack, BlockType.FUNCTION);
}

export function isInstructionInsideModuleOrFunction(blockStack: BlockStack) {
	return isInstructionIsInsideAModule(blockStack) || isInstructionInsideFunction(blockStack);
}

export function isInstructionIsInsideBlock(blockStack: BlockStack, blockType: BlockTypeValue) {
	return hasBlockType(blockStack, blockType);
}

function hasBlockType(blockStack: BlockStack, blockType: BlockTypeValue) {
	for (let i = blockStack.length - 1; i >= 0; i--) {
		if (blockStack[i].blockType === blockType) {
			return true;
		}
	}
	return false;
}
