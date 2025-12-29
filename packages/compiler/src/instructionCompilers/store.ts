import { ErrorCode } from '../errors';
import { saveByteCode } from '../utils';
import { f32store, i32store } from '../wasmUtils/instructionHelpers';
import { compileSegment } from '../compiler';
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
		onInsufficientOperands: ErrorCode.INSUFFICIENT_OPERANDS,
	},
	(line, context) => {
		const operand1Value = context.stack.pop()!;
		const operand2Address = context.stack.pop()!;

		if (operand2Address.isSafeMemoryAddress) {
			return saveByteCode(context, operand1Value.isInteger ? i32store() : f32store());
		} else {
			context.stack.push(operand2Address);
			context.stack.push(operand1Value);

			const tempAddressVariableName = '__storeAddress_temp_' + line.lineNumber;
			const tempValueVariableName = '__storeValue_temp_' + line.lineNumber;
			// Memory overflow protection.
			const ret = compileSegment(
				[
					`local int ${tempAddressVariableName}`,
					`local ${operand1Value.isInteger ? 'int' : 'float'} ${tempValueVariableName}`,

					`localSet ${tempValueVariableName}`,
					`localSet ${tempAddressVariableName}`,

					`localGet ${tempAddressVariableName}`,
					`push ${context.memoryByteSize - 1}`,
					'greaterThan',
					'if int',
					`push 0`,
					'else',
					`localGet ${tempAddressVariableName}`,
					'ifEnd',
					`localGet ${tempValueVariableName}`,
					...(operand1Value.isInteger ? i32store() : f32store()).map(wasmInstruction => {
						return `wasm ${wasmInstruction}`;
					}),
				],
				context
			);

			context.stack.pop();
			context.stack.pop();

			return ret;
		}
	}
);

export default store;
