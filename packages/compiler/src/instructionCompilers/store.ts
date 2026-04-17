import { f32store, f64store, i32store } from '@8f4e/compiler-wasm-utils';

import { ErrorCode } from '../compilerError';
import { saveByteCode } from '../utils/compilation';
import { withValidation } from '../withValidation';

import type { InstructionCompiler } from '../types';

/**
 * Instruction compiler for `store`.
 * @see [Instruction docs](../../docs/instructions/memory.md)
 */
const store: InstructionCompiler = withValidation(
	{
		scope: 'module',
		onInvalidScope: ErrorCode.INSTRUCTION_INVALID_OUTSIDE_BLOCK,
		minOperands: 2,
		operandTypes: ['int'],
	},
	(line, context) => {
		const operand1Value = context.stack.pop()!;
		const operand2Address = context.stack.pop()!;
		void operand2Address;

		return saveByteCode(
			context,
			operand1Value.isInteger ? i32store() : operand1Value.isFloat64 ? f64store() : f32store()
		);
	}
);

export default store;
