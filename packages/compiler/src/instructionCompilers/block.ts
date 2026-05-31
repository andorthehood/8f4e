import type { BlockLine, InstructionCompiler } from '@8f4e/compiler-spec';
import { BlockType } from '@8f4e/compiler-spec';
import { WASM_BLOCK } from '@8f4e/compiler-wasm-utils';
import { pushBlock } from '../utils/blockStack';
import createResultBlockState from './utils/createResultBlockState';
import { saveByteCode } from './utils/saveByteCode';

/**
 * Instruction compiler for `block`.
 * @see [Instruction docs](../../docs/instructions/control-flow.md)
 */
const block: InstructionCompiler<BlockLine> = (line: BlockLine, context) => {
	const { blockState, wasmType } = createResultBlockState(line.blockBlock?.resultType, BlockType.BLOCK);

	pushBlock(context, blockState);
	return saveByteCode(context, [WASM_BLOCK, wasmType]);
};

export default block;
