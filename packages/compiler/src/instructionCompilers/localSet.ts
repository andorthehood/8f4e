import { localSet } from '@8f4e/compiler-wasm-utils';

import { ErrorCode, getError } from '../compilerError';
import { saveByteCode } from '../utils/compilation';
import { withValidation } from '../withValidation';

import type { CodegenLocalSetLine, InstructionCompiler } from '../types';

/**
 * Instruction compiler for `localSet`.
 * @see [Instruction docs](../../docs/instructions/declarations-and-locals.md)
 */
const _localSet: InstructionCompiler<CodegenLocalSetLine> = withValidation<CodegenLocalSetLine>(
	{
		scope: 'moduleOrFunction',
		onInvalidScope: ErrorCode.INSTRUCTION_INVALID_OUTSIDE_BLOCK,
		minOperands: 1,
	},
	(line: CodegenLocalSetLine, context) => {
		const operand = context.stack.pop()!;
		const local = context.locals[line.arguments[0].value]!;

		if (local.isInteger && !operand.isInteger) {
			throw getError(ErrorCode.ONLY_INTEGERS, line, context);
		}

		if (!local.isInteger && operand.isInteger) {
			throw getError(ErrorCode.ONLY_FLOATS, line, context);
		}

		return saveByteCode(context, localSet(local.index));
	}
);

export default _localSet;
