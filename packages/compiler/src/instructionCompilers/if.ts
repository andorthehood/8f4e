import { WASM_IF } from '@8f4e/compiler-wasm-utils';
import { BlockType } from '@8f4e/compiler-spec';

import createResultBlockState from './utils/createResultBlockState';
import { saveByteCode } from './utils/saveByteCode';

import { pushBlock } from '../utils/blockStack';

import type { IfLine, InstructionCompiler } from '@8f4e/compiler-spec';

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
