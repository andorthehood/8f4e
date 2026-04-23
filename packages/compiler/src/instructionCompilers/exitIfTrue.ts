import { Type, WASMInstruction } from '@8f4e/compiler-wasm-utils';

import { ErrorCode, getError } from '../compilerError';
import { isInstructionInsideFunction } from '../utils/blockStack';
import { saveByteCode } from '../utils/compilation';
import { withValidation } from '../withValidation';

import type { ExitIfTrueLine, InstructionCompiler } from '../types';

/**
 * Instruction compiler for `exitIfTrue`.
 *
 * Consumes an integer condition from the stack. If the condition is non-zero,
 * exits the enclosing module immediately and drops any currently stacked values.
 * Otherwise execution continues normally.
 *
 * Only valid inside module blocks.
 *
 * @see [Instruction docs](../../docs/instructions/control-flow.md)
 */
const exitIfTrue: InstructionCompiler<ExitIfTrueLine> = withValidation<ExitIfTrueLine>(
	{
		scope: 'moduleOrFunction',
		minOperands: 1,
		operandTypes: 'int',
	},
	(line: ExitIfTrueLine, context) => {
		if (isInstructionInsideFunction(context.blockStack)) {
			throw getError(ErrorCode.EXIT_IF_TRUE_OUTSIDE_MODULE, line, context);
		}

		context.stack.pop()!;

		const drops = context.stack.flatMap(() => [WASMInstruction.DROP]);

		return saveByteCode(context, [
			WASMInstruction.IF,
			Type.VOID,
			...drops,
			WASMInstruction.RETURN,
			WASMInstruction.END,
		]);
	}
);

export default exitIfTrue;
