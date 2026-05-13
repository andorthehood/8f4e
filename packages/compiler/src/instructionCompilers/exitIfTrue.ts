import { WASM_DROP, WASM_END, WASM_IF, WASM_RETURN, WASM_TYPE_VOID } from '@8f4e/compiler-wasm-utils';
import { ErrorCode } from '@8f4e/compiler-spec';

import { saveByteCode } from './utils/saveByteCode';

import { getError } from '../compilerError';
import { isInstructionInsideFunction } from '../utils/blockStack';

import type { ExitIfTrueLine, InstructionCompiler } from '@8f4e/compiler-spec';

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
const exitIfTrue: InstructionCompiler<ExitIfTrueLine> = (line: ExitIfTrueLine, context) => {
	if (isInstructionInsideFunction(context.blockStack)) {
		throw getError(ErrorCode.EXIT_IF_TRUE_OUTSIDE_MODULE, line, context);
	}

	context.stack.pop()!;

	const drops = context.stack.flatMap(() => [WASM_DROP]);

	return saveByteCode(context, [WASM_IF, WASM_TYPE_VOID, ...drops, WASM_RETURN, WASM_END]);
};

export default exitIfTrue;
