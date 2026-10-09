import type { BlockState, LoopBlockStackFrame } from '@8f4e/language-spec';
import { BlockType } from '@8f4e/language-spec';

/** Creates block tracking from an already-seeded stack. */
export function createBlockState<TLoop extends LoopBlockStackFrame = LoopBlockStackFrame>(
	blockStack: BlockState<TLoop>['blockStack'] = []
): BlockState<TLoop> {
	const state: BlockState<TLoop> = {
		blockStack: [],
		activeBlockDepths: {
			[BlockType.MODULE]: 0,
			[BlockType.FUNCTION]: 0,
			[BlockType.BLOCK]: 0,
			[BlockType.LOOP]: 0,
			[BlockType.CONDITION]: 0,
			[BlockType.CONSTANTS]: 0,
			[BlockType.MAP]: 0,
		},
		activeLoopBlocks: [],
	};
	for (const block of blockStack) pushBlock(state, block);
	return state;
}

/** Pushes a block and updates its cached active state. */
export function pushBlock<TLoop extends LoopBlockStackFrame>(
	context: BlockState<TLoop>,
	block: BlockState<TLoop>['blockStack'][number]
): void {
	context.blockStack.push(block);
	context.activeBlockDepths[block.blockType]++;
	if (block.blockType === BlockType.LOOP) context.activeLoopBlocks.push(block);
	if (block.blockType === BlockType.MAP) context.activeMapBlock = block;
}

/** Pops the innermost block and updates its cached active state. */
export function popBlock<TLoop extends LoopBlockStackFrame>(context: BlockState<TLoop>) {
	const block = context.blockStack.pop();
	if (!block) return block;
	context.activeBlockDepths[block.blockType]--;
	if (block.blockType === BlockType.LOOP) context.activeLoopBlocks.pop();
	if (block.blockType === BlockType.MAP) context.activeMapBlock = undefined;
	return block;
}
