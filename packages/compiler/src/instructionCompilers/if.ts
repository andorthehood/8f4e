import type { IfLine, InstructionCompiler } from '@8f4e/compiler-spec';
import { BlockType } from '@8f4e/compiler-spec';
import { WASM_IF } from '@8f4e/compiler-wasm-utils';
import { pushBlock } from '../utils/blockStack';
import createResultBlockState from './utils/createResultBlockState';
import { saveByteCode } from './utils/saveByteCode';

/**
 * Instruction compiler for `if`.
 * @see [Instruction docs](../../docs/instructions/control-flow.md)
 */
const _if: InstructionCompiler<IfLine> = (line, context) => {
	const { blockState, wasmType } = createResultBlockState(line.ifBlock?.resultType, BlockType.CONDITION);

	pushBlock(context, blockState);
	return saveByteCode(context, [WASM_IF, wasmType]);
};

export default _if;
