import type { InstructionCompiler } from '@8f4e/compiler-spec';
import { WASM_END } from '@8f4e/compiler-wasm-utils';

import { popBlock } from '../utils/blockStack';
import { saveByteCode } from './utils/saveByteCode';

/**
 * Instruction compiler for `blockEnd`.
 * @see [Instruction docs](../../docs/instructions/control-flow.md)
 */
const blockEnd: InstructionCompiler = (line, context) => {
	popBlock(context);

	return saveByteCode(context, [WASM_END]);
};

export default blockEnd;
