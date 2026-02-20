import { ErrorCode } from '../errors';
import { saveByteCode } from '../utils/compilation';
import f32store from '../wasmUtils/store/f32store';
import f64store from '../wasmUtils/store/f64store';
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
			return saveByteCode(
				context,
				operand1Value.isInteger ? i32store() : operand1Value.isFloat64 ? f64store() : f32store()
			);
		} else {
			context.stack.push(operand2Address);
			context.stack.push(operand1Value);

			const tempAddressVariableName = '__storeAddress_temp_' + line.lineNumber;
			const tempValueVariableName = '__storeValue_temp_' + line.lineNumber;
			const tempValueType = operand1Value.isInteger ? 'int' : operand1Value.isFloat64 ? 'float64' : 'float';
			const storeOpcodes = operand1Value.isInteger ? i32store() : operand1Value.isFloat64 ? f64store() : f32store();
			// Memory overflow protection.
			const ret = compileSegment(
				[
					`local int ${tempAddressVariableName}`,
					`local ${tempValueType} ${tempValueVariableName}`,

					`localSet ${tempValueVariableName}`,
					`localSet ${tempAddressVariableName}`,

					`localGet ${tempAddressVariableName}`,
					`push ${context.memoryByteSize - (operand1Value.isFloat64 ? 8 : 4)}`,
					'greaterThan',
					'if int',
					`push 0`,
					'else',
					`localGet ${tempAddressVariableName}`,
					'ifEnd',
					`localGet ${tempValueVariableName}`,
					...storeOpcodes.map(wasmInstruction => {
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

		it('emits f64.store (opcode 57) for float64 value at safe address', () => {
			const context = createInstructionCompilerTestContext();
			context.stack.push(
				{ isInteger: true, isNonZero: false, isSafeMemoryAddress: true },
				{ isInteger: false, isFloat64: true, isNonZero: false }
			);

			store({ lineNumber: 3, instruction: 'store', arguments: [] } as AST[number], context);

			expect(context.byteCode).toContain(57); // F64_STORE opcode
			expect(context.byteCode).not.toContain(56); // no F32_STORE
			expect(context.byteCode).not.toContain(54); // no I32_STORE
			expect(context.stack).toHaveLength(0);
		});

		it('emits f32.store (opcode 56) for float32 value at safe address, not f64.store', () => {
			const context = createInstructionCompilerTestContext();
			context.stack.push(
				{ isInteger: true, isNonZero: false, isSafeMemoryAddress: true },
				{ isInteger: false, isNonZero: false }
			);

			store({ lineNumber: 4, instruction: 'store', arguments: [] } as AST[number], context);

			expect(context.byteCode).toContain(56); // F32_STORE opcode
			expect(context.byteCode).not.toContain(57); // no F64_STORE
		});

		it('emits f64.store for float64 value at unsafe address with bounds check', () => {
			const context = createInstructionCompilerTestContext({ memoryByteSize: 16 });
			context.stack.push(
				{ isInteger: true, isNonZero: false, isSafeMemoryAddress: false },
				{ isInteger: false, isFloat64: true, isNonZero: false }
			);

			store({ lineNumber: 5, instruction: 'store', arguments: [] } as AST[number], context);

			expect(context.byteCode).toContain(57); // F64_STORE opcode
			expect(context.byteCode).not.toContain(56); // no F32_STORE
			expect(context.stack).toHaveLength(0);
		});

		it('uses float64 local type for temp value when storing float64 at unsafe address', () => {
			const context = createInstructionCompilerTestContext({ memoryByteSize: 16 });
			context.stack.push(
				{ isInteger: true, isNonZero: false, isSafeMemoryAddress: false },
				{ isInteger: false, isFloat64: true, isNonZero: false }
			);

			store({ lineNumber: 6, instruction: 'store', arguments: [] } as AST[number], context);

			const valueLocal = Object.entries(context.namespace.locals).find(([name]) =>
				name.startsWith('__storeValue_temp_')
			);
			expect(valueLocal).toBeDefined();
			expect(valueLocal![1].isFloat64).toBe(true);
			expect(valueLocal![1].isInteger).toBe(false);
		});
	});
}
