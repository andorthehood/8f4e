import type { InstructionCompiler } from '@8f4e/compiler-spec';
import { br, WASM_END } from '@8f4e/compiler-wasm-utils';

import { popBlock } from '../utils/blockStack';
import { saveByteCode } from './utils/saveByteCode';

/**
 * Instruction compiler for `loopEnd`.
 * @see [Instruction docs](../../docs/instructions/control-flow.md)
 */
const loopEnd: InstructionCompiler = (line, context) => {
	popBlock(context);

	return saveByteCode(context, [...br(0), WASM_END, WASM_END]);
};

export default loopEnd;
