import { WASM_ELSE } from '@8f4e/compiler-wasm-utils';
import { BlockType } from '@8f4e/compiler-spec';

import { saveByteCode } from './utils/saveByteCode';

import { popExpectedBlock, pushBlock } from '../utils/blockStack';

import type { InstructionCompiler } from '@8f4e/compiler-spec';

/**
 * Instruction compiler for `else`.
 * @see [Instruction docs](../../docs/instructions/control-flow.md)
 */
const _else: InstructionCompiler = (line, context) => {
	const block = popExpectedBlock(line, context, BlockType.CONDITION);

	pushBlock(context, block);

	return saveByteCode(context, [WASM_ELSE]);
};

export default _else;
