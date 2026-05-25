import { BlockType, ErrorCode } from '@8f4e/compiler-spec';

import { getError } from '../compilerError';

import type {
	AST,
	BlockFrameByType,
	BlockStack,
	BlockTypeValue,
	CodegenContext,
	CompilationContext,
} from '@8f4e/compiler-spec';

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

export function peekExpectedBlock<TBlockType extends BlockTypeValue>(
	context: BlockContext,
	blockType: TBlockType
): BlockFrameByType<TBlockType> | undefined {
	const block = context.blockStack[context.blockStack.length - 1];
	return block?.blockType === blockType ? (block as BlockFrameByType<TBlockType>) : undefined;
}

export function findExpectedBlock<TBlockType extends BlockTypeValue>(
	context: BlockContext,
	blockType: TBlockType
): BlockFrameByType<TBlockType> | undefined {
	return [...context.blockStack]
		.reverse()
		.find((block): block is BlockFrameByType<TBlockType> => block.blockType === blockType);
}

export function popExpectedBlock<TBlockType extends BlockTypeValue>(
	line: AST[number],
	context: BlockContext,
	blockType: TBlockType
): BlockFrameByType<TBlockType> {
	const block = peekExpectedBlock(context, blockType);

	if (!block) {
		throw getError(ErrorCode.MISSING_BLOCK_START_INSTRUCTION, line, context);
	}

	popBlock(context);
	return block;
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
