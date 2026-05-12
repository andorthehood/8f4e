import { WASMInstruction, br } from '@8f4e/compiler-wasm-utils';
import { BLOCK_TYPE } from '@8f4e/compiler-spec';
import { ErrorCode } from '@8f4e/compiler-spec';

import consumeExpectedBlockResult from './utils/consumeExpectedBlockResult';
import { saveByteCode } from './utils/saveByteCode';

import { getError } from '../compilerError';

import type { InstructionCompiler } from '@8f4e/compiler-spec';

/**
 * Instruction compiler for `loopEnd`.
 * @see [Instruction docs](../../docs/instructions/control-flow.md)
 */
const loopEnd: InstructionCompiler = (line, context) => {
	const block = context.blockStack.pop();

	if (!block || block.blockType !== BLOCK_TYPE.LOOP) {
		throw getError(ErrorCode.MISSING_BLOCK_START_INSTRUCTION, line, context);
	}

	consumeExpectedBlockResult(block, line, context, { restore: true });

	return saveByteCode(context, [...br(0), WASMInstruction.END, WASMInstruction.END]);
};

export default loopEnd;
