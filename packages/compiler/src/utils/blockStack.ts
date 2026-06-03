import type { BlockStack, BlockTypeValue, CodegenContext, CompilationContext } from '@8f4e/compiler-spec';
import { BlockType } from '@8f4e/compiler-spec';

/** Context shape shared by semantic analysis and codegen while mutating block state. */
type BlockContext = CodegenContext | CompilationContext;

/**
 * Pushes a compiler block and updates all cached active-block state.
 *
 * @param context - Compilation context used by the operation.
 * @param block - block value to use.
 * @returns The computed result.
 */
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

/**
 * Pops the innermost compiler block and updates all cached active-block state.
 *
 * @param context - Compilation context used by the operation.
 * @returns The computed result.
 */
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

/** Synchronizes legacy inside-block booleans with the cached block depth for a block type. */
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
