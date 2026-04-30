import { f32store, f64store, i32store } from '@8f4e/compiler-wasm-utils';

import assertFunctionMemoryIoAllowed from './assertFunctionMemoryIoAllowed';

import { ErrorCode } from '../compilerError';
import { saveByteCode } from '../utils/compilation';
import { guardedStore, isSafeMemoryAccess } from '../utils/memoryAccessGuard';
import { withValidation } from '../withValidation';

import type { InstructionCompiler } from '@8f4e/compiler-types';

/**
 * Instruction compiler for `store`.
 * @see [Instruction docs](../../docs/instructions/memory.md)
 */
const store: InstructionCompiler = withValidation(
	{
		scope: 'moduleOrFunction',
		onInvalidScope: ErrorCode.INSTRUCTION_INVALID_OUTSIDE_BLOCK,
		minOperands: 2,
		operandTypes: ['int'],
	},
	(line, context) => {
		assertFunctionMemoryIoAllowed(line, context);
		const operand1Value = context.stack.pop()!;
		const operand2Address = context.stack.pop()!;
		const instructions = operand1Value.isInteger ? i32store() : operand1Value.isFloat64 ? f64store() : f32store();
		const accessByteWidth = operand1Value.isFloat64 ? 8 : 4;
		if (isSafeMemoryAccess(operand2Address, accessByteWidth)) {
			return saveByteCode(context, instructions);
		}

		return saveByteCode(
			context,
			guardedStore(context, {
				value: operand1Value,
				accessByteWidth,
				lineNumberAfterMacroExpansion: line.lineNumberAfterMacroExpansion,
				storeByteCode: instructions,
			})
		);
	}
);

export default store;
