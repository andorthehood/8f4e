import { WASMInstruction, i32const, localGet } from '@8f4e/compiler-wasm-utils';

import { ErrorCode, getError } from '../compilerError';
import { BLOCK_TYPE } from '../types';
import { saveByteCode } from '../utils/compilation';
import { withValidation } from '../withValidation';

import type { InstructionCompiler, LoopIndexLine } from '../types';

const loopIndex: InstructionCompiler<LoopIndexLine> = withValidation<LoopIndexLine>(
	{
		scope: 'moduleOrFunction',
	},
	(line, context) => {
		const loopBlock = [...context.blockStack].reverse().find(block => block.blockType === BLOCK_TYPE.LOOP);

		if (!loopBlock?.loopCounterLocalName) {
			throw getError(ErrorCode.INSTRUCTION_INVALID_OUTSIDE_LOOP, line, context);
		}

		const local = context.locals[loopBlock.loopCounterLocalName];

		if (!local) {
			throw getError(ErrorCode.INSTRUCTION_INVALID_OUTSIDE_LOOP, line, context);
		}

		context.stack.push({ isInteger: true, isNonZero: false });

		return saveByteCode(context, [...localGet(local.index), ...i32const(1), WASMInstruction.I32_SUB]);
	}
);

export default loopIndex;
