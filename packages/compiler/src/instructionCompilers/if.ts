import { WASMInstruction } from '@8f4e/compiler-wasm-utils';
import { BLOCK_TYPE } from '@8f4e/compiler-spec';

import createResultBlockState from './utils/createResultBlockState';
import { saveByteCode } from './utils/saveByteCode';

import type { IfLine, InstructionCompiler } from '@8f4e/compiler-spec';

/**
 * Instruction compiler for `if`.
 * @see [Instruction docs](../../docs/instructions/control-flow.md)
 */
const _if: InstructionCompiler<IfLine> = (line, context) => {
	// Non-null assertion is safe: instruction validation confirmed 1 operand exists before this function was called
	context.stack.pop()!;
	const { blockState, wasmType } = createResultBlockState(line.ifBlock?.resultType, BLOCK_TYPE.CONDITION);

	context.blockStack.push(blockState);
	return saveByteCode(context, [WASMInstruction.IF, wasmType]);
};

export default _if;
