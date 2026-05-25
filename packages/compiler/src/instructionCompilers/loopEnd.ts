import { br, WASM_END } from '@8f4e/compiler-wasm-utils';
import { BlockType } from '@8f4e/compiler-spec';

import { saveByteCode } from './utils/saveByteCode';

import { popExpectedBlock } from '../utils/blockStack';

import type { InstructionCompiler } from '@8f4e/compiler-spec';

/**
 * Instruction compiler for `loopEnd`.
 * @see [Instruction docs](../../docs/instructions/control-flow.md)
 */
const loopEnd: InstructionCompiler = (line, context) => {
	popExpectedBlock(line, context, BlockType.LOOP);

	return saveByteCode(context, [...br(0), WASM_END, WASM_END]);
};

export default loopEnd;
