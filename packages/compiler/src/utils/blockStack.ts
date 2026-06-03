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
	context.activeBlockDepths[block.blockType]++;

	if (block.blockType === BlockType.LOOP) {
		context.activeLoopBlocks.push(block);
	}

	if (block.blockType === BlockType.MAP) {
		context.activeMapBlock = block;
	}

	updateBlockContextFlag(context, block.blockType, true);
}

export function popBlock(context: BlockContext) {
	const block = context.blockStack.pop();

	if (!block) {
		return block;
	}

	context.activeBlockDepths[block.blockType]--;

	if (block?.blockType === BlockType.LOOP) {
		context.activeLoopBlocks.pop();
	}

	if (block.blockType === BlockType.MAP) {
		context.activeMapBlock = undefined;
	}

	updateBlockContextFlag(context, block.blockType, context.activeBlockDepths[block.blockType] > 0);

	return block;
}

export function peekMapBlock(context: BlockContext): MapBlockStackFrame {
	return context.activeMapBlock!;
}

export function popMapBlock(context: BlockContext): MapBlockStackFrame {
	return popBlock(context) as MapBlockStackFrame;
}

export function findNearestLoopBlock(context: BlockContext): LoopBlockStackFrame {
	return context.activeLoopBlocks[context.activeLoopBlocks.length - 1];
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
