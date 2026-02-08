import { ErrorCode } from '../errors';
import f32store from '../wasmUtils/store/f32store';
import i32store from '../wasmUtils/store/i32store';
import { compileSegment } from '../compiler';
import { withValidation } from '../withValidation';
import createInstructionCompilerTestContext from '../utils/testUtils';

import type { AST, InstructionCompiler } from '../types';

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
			context.byteCode.push(...(operand1Value.isInteger ? i32store() : f32store()));
			return context;
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

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('store instruction compiler', () => {
		it('stores to a safe memory address', () => {
			const context = createInstructionCompilerTestContext();
			context.stack.push(
				{ isInteger: true, isNonZero: false, isSafeMemoryAddress: true },
				{ isInteger: true, isNonZero: false }
			);

			store({ lineNumber: 1, instruction: 'store', arguments: [] } as AST[number], context);

			expect({
				stack: context.stack,
				byteCode: context.byteCode,
			}).toMatchSnapshot();
		});

		it('wraps unsafe address with bounds check', () => {
			const context = createInstructionCompilerTestContext({ memoryByteSize: 16 });
			context.stack.push(
				{ isInteger: true, isNonZero: false, isSafeMemoryAddress: false },
				{ isInteger: true, isNonZero: false }
			);

			store({ lineNumber: 2, instruction: 'store', arguments: [] } as AST[number], context);

			expect({
				stack: context.stack,
				byteCode: context.byteCode,
			}).toMatchSnapshot();
		});
	});
}
