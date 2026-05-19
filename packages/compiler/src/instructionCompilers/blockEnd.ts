import { WASM_END } from '@8f4e/compiler-wasm-utils';
import { ErrorCode } from '@8f4e/compiler-spec';

import consumeExpectedBlockResult from './utils/consumeExpectedBlockResult';
import { saveByteCode } from './utils/saveByteCode';

import { getError } from '../compilerError';
import { popBlock } from '../utils/blockStack';

import type { InstructionCompiler } from '@8f4e/compiler-spec';

/**
 * Instruction compiler for `blockEnd`.
 * @see [Instruction docs](../../docs/instructions/control-flow.md)
 */
const blockEnd: InstructionCompiler = (line, context) => {
	const block = popBlock(context);

	if (!block) {
		throw getError(ErrorCode.MISSING_BLOCK_START_INSTRUCTION, line, context);
	}

	consumeExpectedBlockResult(block, line, context, { restore: true });

	return saveByteCode(context, [WASM_END]);
};

export default blockEnd;
