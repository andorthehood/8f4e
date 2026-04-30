import { WASMInstruction } from '@8f4e/compiler-wasm-utils';

import { ErrorCode } from '../compilerError';
import { saveByteCode } from '../utils/compilation';
import { withValidation } from '../withValidation';

import type { InstructionCompiler } from '@8f4e/compiler-types';

/**
 * Instruction compiler for `return`.
 *
 * Emits a WebAssembly `return` instruction, immediately returning from the
 * enclosing function. Only valid inside a function block — not in a module.
 *
 * The return type is already declared by `functionEnd`; the WASM validator
 * ensures the stack matches. Takes no arguments.
 *
 * @see [Instruction docs](../../docs/instructions/blocks/function.md)
 */
const _return: InstructionCompiler = withValidation(
	{
		scope: 'function',
		onInvalidScope: ErrorCode.RETURN_OUTSIDE_FUNCTION,
	},
	(line, context) => {
		saveByteCode(context, [WASMInstruction.RETURN]);

		// Clear the stack — execution does not continue past a return
		context.stack = [];

		return context;
	}
);

export default _return;
