import { WASM_END } from '@8f4e/compiler-wasm-utils';
import { BlockType } from '@8f4e/compiler-spec';

import { saveByteCode } from './utils/saveByteCode';

import { popExpectedBlock } from '../utils/blockStack';

import type { InstructionCompiler } from '@8f4e/compiler-spec';

/**
 * Instruction compiler for `ifEnd`.
 * @see [Instruction docs](../../docs/instructions/control-flow.md)
 */
const ifEnd: InstructionCompiler = (line, context) => {
	popExpectedBlock(line, context, BlockType.CONDITION);

	return saveByteCode(context, [WASM_END]);
};

export default ifEnd;
