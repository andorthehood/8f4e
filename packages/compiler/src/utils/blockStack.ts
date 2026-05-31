import type {
	BlockStack,
	BlockTypeValue,
	CodegenContext,
	CompilationContext,
	LoopBlockStackFrame,
	MapBlockStackFrame,
} from '@8f4e/compiler-spec';
import { BlockType } from '@8f4e/compiler-spec';

type BlockContext = CodegenContext | CompilationContext;

export function pushBlock(context: BlockContext, block: BlockStack[number]) {
	context.blockStack.push(block);
	updateBlockContextFlag(context, block.blockType, true);
}

export function popBlock(context: BlockContext) {
	const block = context.blockStack.pop();

	if (block && !context.blockStack.some(remainingBlock => remainingBlock.blockType === block.blockType)) {
		updateBlockContextFlag(context, block.blockType, false);
	}

	return block;
}

export function peekMapBlock(context: BlockContext): MapBlockStackFrame {
	return context.blockStack[context.blockStack.length - 1] as MapBlockStackFrame;
}

export function popMapBlock(context: BlockContext): MapBlockStackFrame {
	return popBlock(context) as MapBlockStackFrame;
}

export function findNearestLoopBlock(context: BlockContext): LoopBlockStackFrame {
	return [...context.blockStack].reverse().find(block => block.blockType === BlockType.LOOP) as LoopBlockStackFrame;
}

function updateBlockContextFlag(context: BlockContext, blockType: BlockTypeValue, isInside: boolean) {
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
