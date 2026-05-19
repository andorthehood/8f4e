import { BlockType } from '@8f4e/compiler-spec';

import type { BlockStack, BlockTypeValue, CompilationContext } from '@8f4e/compiler-spec';

export function pushBlock(context: CompilationContext, block: BlockStack[number]) {
	context.blockStack.push(block);
	updateBlockContextFlag(context, block.blockType, true);
}

export function popBlock(context: CompilationContext) {
	const block = context.blockStack.pop();

	if (block && !context.blockStack.some(remainingBlock => remainingBlock.blockType === block.blockType)) {
		updateBlockContextFlag(context, block.blockType, false);
	}

	return block;
}

function updateBlockContextFlag(context: CompilationContext, blockType: BlockTypeValue, isInside: boolean) {
	switch (blockType) {
		case BlockType.MODULE:
			context.insideModuleBlock = isInside;
			break;
		case BlockType.FUNCTION:
			context.insideFunctionBlock = isInside;
			break;
		case BlockType.BLOCK:
			context.insideGenericBlock = isInside;
			break;
		case BlockType.LOOP:
			context.insideLoopBlock = isInside;
			break;
		case BlockType.CONDITION:
			context.insideConditionBlock = isInside;
			break;
		case BlockType.CONSTANTS:
			context.insideConstantsBlock = isInside;
			break;
		case BlockType.MAP:
			context.insideMapBlock = isInside;
			break;
	}
}
